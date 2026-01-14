import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ✅ Objectif
 * - Ne PAS forcer la ville/code postal si l'utilisateur ne parle pas d'immo
 * - Déclencher le "mode immo" seulement si intention claire (intent detection)
 * - Eviter de "s'accrocher" à une ville mentionnée il y a longtemps (contexte récent)
 * - Garder une conversation naturelle : si infos manquent, demander gentiment, sinon répondre normalement
 */

/* ----------------------------- Extractors ----------------------------- */

function extractPostalCode(text) {
  const match = text.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

function extractArrondissement(text) {
  const match = text
    .toLowerCase()
    .match(/\b(1?\d|20)\s*(?:e|eme|ème)?\s*(?:arrondissement)?\b/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return n >= 1 && n <= 20 ? n : null;
}

function extractCityGuess(text) {
  // Liste courte (tu peux l'étendre)
  const cities = [
    "marseille", "paris", "lyon", "bordeaux", "toulouse",
    "nantes", "lille", "nice", "strasbourg", "montpellier",
    "rennes", "grenoble", "dijon", "angers", "reims"
  ];

  const lower = text.toLowerCase();

  // 1) Match direct sur villes connues
  for (const city of cities) {
    if (lower.includes(city)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  // 2) Heuristique : "à <ville>", "dans <ville>"...
  const match = text.match(/\b(?:à|a|dans|sur|vers)\s+([A-Za-zÀ-ÖØ-öø-ÿ'\- ]{2,40})/i);
  if (match) {
    const city = match[1].trim().split(/[,.!?]/)[0].trim();
    if (city.length >= 2) return city;
  }

  return null;
}

function isArrondissementCity(city) {
  const lower = city.toLowerCase();
  return lower === "paris" || lower === "marseille" || lower === "lyon";
}

function slugifyCity(city) {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildMeilleursAgentsUrl(city, postalCode, arrondissement) {
  const citySlug = slugifyCity(city);

  if (arrondissement && isArrondissementCity(city)) {
    return `https://www.meilleursagents.com/prix-immobilier/${citySlug}-${arrondissement}eme-arrondissement-${postalCode}/`;
  }
  return `https://www.meilleursagents.com/prix-immobilier/${citySlug}-${postalCode}/`;
}

/* ----------------------------- Context helpers ----------------------------- */

function buildRecentContext(history = [], message, maxTurns = 8) {
  const slice = Array.isArray(history) ? history.slice(-maxTurns) : [];
  return (
    slice
      .map((msg) => `${msg.role === "user" ? "Utilisateur" : "Assistant"}: ${msg.content}`)
      .join("\n") + `\nUtilisateur: ${message}`
  );
}

/* ----------------------------- Intent detection ----------------------------- */

function isRealEstateIntent(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.toLowerCase();

  // Mots-clés forts (immo/invest locatif)
  const strong = [
    "invest", "investissement", "locatif", "rendement", "rentabilité",
    "cashflow", "cash-flow", "loyer", "loyers", "prix au m2", "prix/m2",
    "prix m2", "prix immobilier", "acheter", "achat", "appartement", "maison",
    "studio", "t1", "t2", "t3", "immeuble", "colocation", "lmnp", "pinel",
    "dpe", "taxe foncière", "charges", "meilleursagents", "prix-immobilier",
    "cap rate", "vacance", "vacance locative"
  ];

  // Intent "analyse marché / data"
  const marketSignals = [
    "analyse", "marché", "moyenne", "médian", "evolution", "tendance",
    "compar", "quartier", "où investir", "meilleur quartier", "prix", "loyer"
  ];

  // Anti faux-positifs (dev / small talk / auto etc.)
  const nonImmo = [
    "code", "bug", "javascript", "deno", "api", "react", "typescript",
    "voiture", "auto", "moteur", "pneu", "contrôle technique", "inspection",
    "salut", "bonjour", "merci", "lol"
  ];

  const hasStrong = strong.some((k) => t.includes(k));
  const hasMarket = marketSignals.some((k) => t.includes(k));
  const hasNonImmo = nonImmo.some((k) => t.includes(k));

  // Si c'est clairement non-immo et pas de signaux immo => false
  if (hasNonImmo && !(hasStrong || hasMarket)) return false;

  // On déclenche si signaux immo suffisants
  return hasStrong || (hasMarket && (t.includes("prix") || t.includes("loyer") || t.includes("rendement")));
}

function shouldUseInternetForImmo(message, history) {
  // Internet seulement si on va réellement analyser une zone (ville+cp) ou si user demande "données / chiffres / source"
  const t = (message || "").toLowerCase();
  const wantsData = ["source", "données", "chiffres", "meilleursagents", "prix", "loyer", "rendement"].some((k) =>
    t.includes(k)
  );
  // Si on est en immo intent, on peut activer web
  return wantsData || isRealEstateIntent(buildRecentContext(history || [], message, 6));
}

/* ----------------------------- Response helpers ----------------------------- */

function safeNumber(x) {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

function formatReplyFromResult(result) {
  // result peut être un objet (schema) ou une string selon l'intégration
  if (!result || typeof result !== "object") return String(result ?? "");

  let reply = result.analysis || "Voici mon analyse :";

  const price = safeNumber(result.price_m2_avg);
  const rent = safeNumber(result.rent_m2_avg);
  const yieldGross = safeNumber(result.gross_yield);

  if (price != null) reply += `\n📊 **Prix moyen**: ${Math.round(price)} €/m²`;
  if (rent != null) reply += `\n💰 **Loyer moyen**: ${rent.toFixed(2)} €/m²/mois`;
  if (yieldGross != null) reply += `\n📈 **Rendement brut estimé**: ${yieldGross.toFixed(2)}%`;

  if (Array.isArray(result.best_neighborhoods) && result.best_neighborhoods.length > 0) {
    reply += `\n\n🏘️ **Meilleurs quartiers**:\n${result.best_neighborhoods.map((n) => `- ${n}`).join("\n")}`;
  }

  if (Array.isArray(result.recommendations) && result.recommendations.length > 0) {
    reply += `\n\n💡 **Recommandations**:\n${result.recommendations
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n")}`;
  }

  return reply;
}

function normalizeHistory(history) {
  return Array.isArray(history) ? history : [];
}

/* ----------------------------- Main handler ----------------------------- */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, history, useInstructions = true } = body || {};

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message requis" }, { status: 400 });
    }

    const hist = normalizeHistory(history);

    // ✅ 1) Mode sans instructions : chat simple
    if (!useInstructions) {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: message,
        add_context_from_internet: false,
      });

      return Response.json({
        reply: result,
        action: "simple_chat",
      });
    }

    // ✅ 2) Même si useInstructions=true, on ne force pas le mode immo si ce n'est pas pertinent
    const recentContext = buildRecentContext(hist, message, 8);
    const immoIntent = isRealEstateIntent(recentContext);

    if (!immoIntent) {
      // Chat normal (conversation naturelle)
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: message,
        add_context_from_internet: false,
      });

      return Response.json({
        reply: result,
        action: "simple_chat",
      });
    }

    // ✅ 3) Ici seulement : on est en "mode immo"
    // Extraction infos (sur contexte récent uniquement)
    const city = extractCityGuess(recentContext);
    const postalCode = extractPostalCode(recentContext);
    const arrondissement = extractArrondissement(recentContext);

    // Demandes progressives mais naturelles
    if (!city) {
      // IMPORTANT: on ne bloque pas la conversation si la question est générale
      // On propose 2 chemins: général vs chiffré
      const prompt = `Tu es un assistant expert en investissement locatif.
L'utilisateur parle d'investissement immobilier mais ne donne pas la ville.
Réponds de façon naturelle:
- Donne d'abord une réponse utile et générale liée à sa question.
- Puis explique que pour chiffrer précisément (prix/loyer/rendement), il faut une ville + code postal.
Question: "${message}"`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      return Response.json({
        reply: `${result}\n\n📍 Pour une analyse chiffrée, dis-moi la **ville + code postal** (ex: "Bordeaux 33000").`,
        action: "ask_city",
      });
    }

    if (isArrondissementCity(city) && !arrondissement) {
      const prompt = `Tu es un assistant expert en investissement locatif.
L'utilisateur vise ${city} mais n'a pas précisé l'arrondissement.
Réponds naturellement en demandant l'arrondissement, et propose un exemple concret.
Message: "${message}"`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      return Response.json({
        reply: `${result}\n\n🗺️ ${city} est découpée en arrondissements. Tu vises lequel ? (ex: "${city} 11e" + code postal)`,
        action: "ask_arrondissement",
      });
    }

    if (!postalCode) {
      const prompt = `Tu es un assistant expert en investissement locatif.
L'utilisateur vise ${city}${arrondissement ? ` ${arrondissement}e` : ""} mais n'a pas donné le code postal.
Réponds naturellement en demandant le code postal, brièvement.
Message: "${message}"`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      return Response.json({
        reply: `${result}\n\n📮 Donne-moi le **code postal** de ${city}${arrondissement ? ` ${arrondissement}e` : ""} pour que je récupère les bons chiffres.`,
        action: "ask_postal_code",
      });
    }

    // ✅ 4) On a ville + cp (+ éventuellement arrondissement) => on construit l'URL
    const url = buildMeilleursAgentsUrl(city, postalCode, arrondissement);

    // ✅ 5) Appel LLM structuré
    const schema = {
      type: "object",
      properties: {
        analysis: {
          type: "string",
          description: "Analyse détaillée pour investissement locatif",
        },
        price_m2_avg: {
          type: "number",
          description: "Prix moyen au m² si disponible",
        },
        rent_m2_avg: {
          type: "number",
          description: "Loyer moyen au m² si disponible",
        },
        gross_yield: {
          type: "number",
          description: "Rendement brut estimé en pourcentage",
        },
        best_neighborhoods: {
          type: "array",
          items: { type: "string" },
          description: "Meilleurs quartiers identifiés",
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
          description: "Recommandations concrètes",
        },
      },
      additionalProperties: true,
    };

    const prompt = `Tu es un expert en investissement immobilier locatif.

Analyse la page ${url} et fournis:
1) Le prix moyen au m² et le loyer moyen (si présents)
2) Calcule un rendement brut proxy: (loyer_mensuel * 12 / prix_m2) * 100
   - Si tu n'as que des loyers au m²: utilise (loyer_m2 * 12 / prix_m2) * 100
3) Identifie les meilleurs quartiers pour investir (si la page donne des indices par quartiers; sinon, propose des heuristiques prudentes)
4) Donne 3 recommandations concrètes basées sur les données trouvées (ou explique clairement ce qui manque)

Question utilisateur: "${message}"

Réponds de manière claire, chiffrée, et exploitable.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: shouldUseInternetForImmo(message, hist),
      response_json_schema: schema,
    });

    const reply = formatReplyFromResult(result);

    return Response.json({
      reply,
      action: "city_snapshot",
      data: {
        city,
        postal_code: postalCode,
        arrondissement,
        source_url: url,
        ...(typeof result === "object" && result ? result : {}),
      },
    });
  } catch (error) {
    console.error("Erreur chatWithMistral:", error);

    return Response.json(
      {
        reply: `❌ Erreur lors de l'analyse: ${error?.message || String(error)}\n\nSi tu veux une analyse immo chiffrée, précise **ville + code postal** (ex: "Bordeaux 33000").`,
        action: "error",
      },
      { status: 500 }
    );
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ✅ Objectif
 * - Assistant spécialisé en investissement locatif
 * - Tunnel conversationnel : présentation -> aide au choix de ville -> analyse précise
 * - Récupération automatique du code postal via API gouvernementale
 * - Réponses structurées et aérées (H1, H2, tableaux, listes)
 */

const SYSTEM_PROMPT = `Tu es un assistant IA expert en investissement immobilier locatif en France.

**Ton rôle :**
- Conseiller sur l'investissement locatif (rentabilité, choix de ville, fiscalité, financement)
- Analyser des marchés immobiliers locaux avec des données chiffrées
- Aider à choisir une ville d'investissement

**Important :**
- Toujours structurer tes réponses avec des titres (##), des listes, des tableaux markdown si pertinent
- Aérer avec des sauts de ligne entre sections
- Être concret et pédagogique
- Si l'utilisateur ne sait pas où investir, guide-le vers une ville qu'il connaît bien

**Ce que tu NE fais PAS :**
- Aide aux devoirs, rédaction générale, traduction, etc.
- Sujets hors investissement immobilier

Reste dans ton domaine d'expertise : l'investissement locatif.`;

/* ----------------------------- Extractors ----------------------------- */

function extractPostalCode(text) {
  const match = text.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

async function getPostalCodeFromCity(cityName) {
  try {
    const response = await fetch('https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux&format=json&geometry=centre');
    const communes = await response.json();
    
    const citySlug = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const match = communes.find(c => {
      const nomSlug = c.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return nomSlug === citySlug || nomSlug.includes(citySlug) || citySlug.includes(nomSlug);
    });
    
    return match && match.codesPostaux && match.codesPostaux.length > 0 
      ? match.codesPostaux[0] 
      : null;
  } catch (error) {
    console.error("Erreur récupération code postal:", error);
    return null;
  }
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

function buildUserOnlyContext(history = [], message, maxTurns = 8) {
  // Ne garde que les messages utilisateur pour éviter d'extraire des infos des réponses de l'IA
  const slice = Array.isArray(history) ? history.slice(-maxTurns) : [];
  const userMessages = slice
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content)
    .join(" ");
  return userMessages + " " + message;
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
  // Le résultat devrait déjà être bien formaté par le LLM avec les instructions
  // On garde juste un fallback pour la compatibilité
  if (!result || typeof result !== "object") return String(result ?? "");
  
  if (result.analysis && typeof result.analysis === "string") {
    return result.analysis;
  }

  let reply = "## 📊 Analyse du marché\n\n";

  const price = safeNumber(result.price_m2_avg);
  const rent = safeNumber(result.rent_m2_avg);
  const yieldGross = safeNumber(result.gross_yield);

  if (price != null || rent != null || yieldGross != null) {
    reply += "| Indicateur | Valeur |\n|------------|--------|\n";
    if (price != null) reply += `| Prix moyen au m² | ${Math.round(price)} € |\n`;
    if (rent != null) reply += `| Loyer moyen au m² | ${rent.toFixed(2)} €/mois |\n`;
    if (yieldGross != null) reply += `| Rendement brut | ${yieldGross.toFixed(2)}% |\n`;
    reply += "\n";
  }

  if (Array.isArray(result.best_neighborhoods) && result.best_neighborhoods.length > 0) {
    reply += `## 🏘️ Meilleurs quartiers\n\n${result.best_neighborhoods.map((n) => `- ${n}`).join("\n")}\n\n`;
  }

  if (Array.isArray(result.recommendations) && result.recommendations.length > 0) {
    reply += `## 💡 Recommandations\n\n${result.recommendations
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n")}\n`;
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

    // ✅ 1) Mode sans instructions : chat simple (LLM générique)
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
    // IMPORTANT : détection sur messages utilisateur uniquement, pas sur réponses IA
    const userOnlyContext = buildUserOnlyContext(hist, message, 8);
    const immoIntent = isRealEstateIntent(userOnlyContext);

    if (!immoIntent) {
      // Conversation hors sujet immo : recadrer gentiment
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

L'utilisateur te parle mais ne semble pas poser une question sur l'investissement locatif.
Réponds brièvement et naturellement, puis rappelle ton domaine d'expertise.

Message utilisateur : "${message}"`,
        add_context_from_internet: false,
      });

      return Response.json({
        reply: result,
        action: "simple_chat",
      });
    }

    // ✅ 3) Ici seulement : on est en "mode immo"
    // Extraction infos (sur messages utilisateur uniquement pour éviter de récupérer les suggestions de l'IA)
    const city = extractCityGuess(userOnlyContext);
    const postalCode = extractPostalCode(userOnlyContext);
    const arrondissement = extractArrondissement(userOnlyContext);

    // Demandes progressives mais naturelles
    if (!city) {
      const prompt = `${SYSTEM_PROMPT}

L'utilisateur s'intéresse à l'investissement locatif mais n'a pas encore précisé de ville.

**Ta mission :**
1. Réponds d'abord à sa question de manière générale et utile
2. Propose-lui de l'aider à choisir une ville d'investissement
3. Conseil important : suggère d'investir dans une ville qu'il connaît bien (proximité, réseau local)
4. Donne 2-3 exemples de villes attractives pour investir (grandes et moyennes villes)

Structure ta réponse avec des titres markdown (##) et aère bien.

Question utilisateur : "${message}"`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
      });

      return Response.json({
        reply: result,
        action: "ask_city",
      });
    }

    if (isArrondissementCity(city) && !arrondissement) {
      const prompt = `${SYSTEM_PROMPT}

L'utilisateur vise **${city}** pour investir mais n'a pas précisé l'arrondissement.

Réponds de manière structurée :
- Explique brièvement pourquoi l'arrondissement est important
- Demande quel arrondissement l'intéresse
- Donne 2-3 exemples d'arrondissements attractifs pour investir

Message utilisateur : "${message}"`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      return Response.json({
        reply: result,
        action: "ask_arrondissement",
      });
    }

    // Récupérer automatiquement le code postal si pas fourni
    let finalPostalCode = postalCode;
    if (!finalPostalCode) {
      finalPostalCode = await getPostalCodeFromCity(city);
      
      if (!finalPostalCode) {
        const prompt = `${SYSTEM_PROMPT}

L'utilisateur vise **${city}${arrondissement ? ` ${arrondissement}e arrondissement` : ""}** mais je n'ai pas trouvé automatiquement le code postal.

Demande-lui le code postal de manière naturelle et concise.

Message utilisateur : "${message}"`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: false,
        });

        return Response.json({
          reply: result,
          action: "ask_postal_code",
        });
      }
    }

    // ✅ 4) On a ville + cp (+ éventuellement arrondissement) => on construit l'URL
    const url = buildMeilleursAgentsUrl(city, finalPostalCode, arrondissement);

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

    const prompt = `${SYSTEM_PROMPT}

**Mission :** Analyse approfondie du marché immobilier de **${city}${arrondissement ? ` ${arrondissement}e arrondissement` : ""}** (${finalPostalCode})

**Source de données :** ${url}

**Analyse attendue :**

## 📊 Données du marché
- Prix moyen au m² (appartement et maison si dispo)
- Loyer moyen au m² 
- Rendement brut estimé : (loyer_m2 * 12 / prix_m2) * 100

## 🏘️ Meilleurs quartiers
- Identifie les quartiers les plus intéressants pour investir
- Explique pourquoi (prix, demande locative, évolution)

## 💡 Recommandations
- 3 conseils concrets et actionnables
- Type de bien à privilégier
- Points de vigilance

**Format de réponse :**
- Structure avec titres markdown (##)
- Tableaux si pertinent pour comparer des données
- Listes à puces
- Aération entre sections
- Emojis pour clarté

Question utilisateur : "${message}"`;


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
        postal_code: finalPostalCode,
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
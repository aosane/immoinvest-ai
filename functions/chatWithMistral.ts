import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helpers pour extraire infos du message
function extractPostalCode(text) {
    const match = text.match(/\b(\d{5})\b/);
    return match ? match[1] : null;
}

function extractArrondissement(text) {
    const match = text.toLowerCase().match(/\b(1?\d|20)\s*(?:e|eme|ème)?\s*(?:arrondissement)?\b/);
    if (!match) return null;
    const n = parseInt(match[1]);
    return (n >= 1 && n <= 20) ? n : null;
}

function extractCityGuess(text) {
    const cities = ["marseille", "paris", "lyon", "bordeaux", "toulouse", "nantes", "lille", "nice", "strasbourg"];
    const lower = text.toLowerCase();
    for (const city of cities) {
        if (lower.includes(city)) {
            return city.charAt(0).toUpperCase() + city.slice(1);
        }
    }
    
    const match = text.match(/\b(?:à|a|dans|sur)\s+([A-Za-zÀ-ÖØ-öø-ÿ'\- ]{2,40})/);
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

function buildMeilleursAgentsUrl(city, postalCode, arrondissement) {
    const citySlug = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
    
    if (arrondissement && isArrondissementCity(city)) {
        return `https://www.meilleursagents.com/prix-immobilier/${citySlug}-${arrondissement}eme-arrondissement-${postalCode}/`;
    }
    return `https://www.meilleursagents.com/prix-immobilier/${citySlug}-${postalCode}/`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, history } = await req.json();

        if (!message || typeof message !== 'string') {
            return Response.json({ error: 'Message requis' }, { status: 400 });
        }

        // Construire le contexte complet (historique + message actuel)
        const fullContext = (history || [])
            .map(msg => `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`)
            .join('\n') + `\nUtilisateur: ${message}`;

        // Extraire les infos du contexte complet (historique + message actuel)
        const city = extractCityGuess(fullContext);
        const postalCode = extractPostalCode(fullContext);
        const arrondissement = extractArrondissement(fullContext);

        // Si pas de ville, demander
        if (!city) {
            return Response.json({
                reply: "Dans quelle ville souhaites-tu investir ? (ex: Bordeaux, Paris, Marseille)",
                action: "ask_city"
            });
        }

        // Si ville à arrondissements sans arrondissement
        if (isArrondissementCity(city) && !arrondissement) {
            return Response.json({
                reply: `${city} est découpée en arrondissements. Quel arrondissement vises-tu ? (ex: "${city} 11e")`,
                action: "ask_arrondissement"
            });
        }

        // Si pas de code postal, demander
        if (!postalCode) {
            return Response.json({
                reply: `Quel est le code postal de ${city}${arrondissement ? ' ' + arrondissement + 'e' : ''} ?`,
                action: "ask_postal_code"
            });
        }

        // Construire l'URL MeilleursAgents
        const url = buildMeilleursAgentsUrl(city, postalCode, arrondissement);

        // Appeler le LLM avec contexte web pour scraper et analyser
        const schema = {
            type: "object",
            properties: {
                analysis: {
                    type: "string",
                    description: "Analyse détaillée pour investissement locatif"
                },
                price_m2_avg: {
                    type: "number",
                    description: "Prix moyen au m² si disponible"
                },
                rent_m2_avg: {
                    type: "number",
                    description: "Loyer moyen au m² si disponible"
                },
                gross_yield: {
                    type: "number",
                    description: "Rendement brut estimé en pourcentage"
                },
                best_neighborhoods: {
                    type: "array",
                    items: { type: "string" },
                    description: "Meilleurs quartiers identifiés"
                },
                recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Recommandations concrètes"
                }
            }
        };

        const prompt = `Tu es un expert en investissement immobilier locatif.

Analyse la page ${url} et fournis:
1. Prix moyen au m² et loyer moyen (si disponibles dans les tableaux)
2. Calcule le rendement brut proxy: (loyer_mensuel * 12 / prix_m2) * 100
3. Identifie les meilleurs quartiers pour investir
4. Donne 3 recommandations concrètes basées sur les données réelles

Question utilisateur: "${message}"

Fournis une analyse complète et chiffrée pour l'investissement locatif.`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: schema
        });

        // Formater la réponse
        let reply = result.analysis || "Voici mon analyse:\n\n";
        
        if (result.price_m2_avg) {
            reply += `\n📊 **Prix moyen**: ${Math.round(result.price_m2_avg)} €/m²`;
        }
        if (result.rent_m2_avg) {
            reply += `\n💰 **Loyer moyen**: ${result.rent_m2_avg.toFixed(2)} €/m²/mois`;
        }
        if (result.gross_yield) {
            reply += `\n📈 **Rendement brut estimé**: ${result.gross_yield.toFixed(2)}%`;
        }
        
        if (result.best_neighborhoods?.length > 0) {
            reply += `\n\n🏘️ **Meilleurs quartiers**:\n${result.best_neighborhoods.map(n => `- ${n}`).join('\n')}`;
        }
        
        if (result.recommendations?.length > 0) {
            reply += `\n\n💡 **Recommandations**:\n${result.recommendations.map((r, i) => `${i+1}. ${r}`).join('\n')}`;
        }

        return Response.json({
            reply,
            action: "city_snapshot",
            data: {
                city,
                postal_code: postalCode,
                arrondissement,
                source_url: url,
                ...result
            }
        });

    } catch (error) {
        console.error('Erreur chatWithMistral:', error);
        
        return Response.json({ 
            reply: `❌ Erreur lors de l'analyse: ${error.message}\n\nEssaie de reformuler ta question avec la ville et le code postal (ex: "Bordeaux 33000")`,
            action: "error"
        }, { status: 500 });
    }
});
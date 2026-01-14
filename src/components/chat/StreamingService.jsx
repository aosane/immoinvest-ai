// Service pour gérer le streaming des réponses IA

const MOCK_RESPONSES = {
  default: `## Bienvenue dans l'investissement locatif ! 🏠

Je suis votre assistant spécialisé en **investissement immobilier locatif en France**. Je peux vous aider sur plusieurs aspects :

### Ce que je peux faire pour vous :

1. **Analyser la rentabilité** d'un bien immobilier
2. **Comparer les régimes fiscaux** (LMNP, LMP, Pinel, etc.)
3. **Identifier les meilleures villes** pour investir
4. **Simuler votre financement** et cash-flow
5. **Optimiser votre fiscalité** immobilière

### Pour commencer, pouvez-vous me préciser :
- Votre budget d'investissement ?
- La ville ou région visée ?
- Vos objectifs (rendement, patrimoine, défiscalisation) ?

Je suis là pour vous accompagner dans votre projet ! 💡`,

  rentabilite: `## Analyse de rentabilité locative 📊

Pour évaluer la rentabilité d'un investissement locatif, voici les indicateurs clés :

### 1. Rendement brut
\`\`\`
Rendement brut = (Loyer annuel / Prix d'achat) × 100
\`\`\`

**Exemple** : Un appartement à 200 000€ loué 800€/mois
- Loyer annuel : 9 600€
- Rendement brut : **4,8%**

### 2. Rendement net
Il faut déduire les charges :
- Taxe foncière
- Charges de copropriété non récupérables
- Assurance PNO
- Frais de gestion (si agence)
- Provision travaux

### 3. Cash-flow
\`\`\`
Cash-flow = Loyers - (Mensualité crédit + Charges)
\`\`\`

> 💡 **Conseil** : Visez un cash-flow positif ou neutre pour un investissement serein.

### Quel bien souhaitez-vous analyser ?`,

  fiscalite: `## Régimes fiscaux en immobilier locatif 🏛️

### Location nue (revenus fonciers)

| Régime | Seuil | Abattement |
|--------|-------|------------|
| Micro-foncier | < 15 000€/an | 30% |
| Réel | > 15 000€/an | Charges réelles |

### Location meublée (BIC)

| Statut | Seuil | Avantages |
|--------|-------|-----------|
| **LMNP** | < 23 000€/an | Amortissement comptable |
| **LMP** | > 23 000€/an | Déficit imputable sur revenus |

### Dispositifs de défiscalisation

1. **Pinel** : Réduction d'impôt jusqu'à 21% sur 12 ans
2. **Denormandie** : Pinel dans l'ancien avec travaux
3. **Malraux** : Réduction pour rénovation patrimoine
4. **Déficit foncier** : Imputation sur revenus globaux

> ⚠️ **Important** : Le choix du régime dépend de votre situation personnelle.

Souhaitez-vous une simulation personnalisée ?`,

  villes: `## Top des villes pour investir en 2024 📍

### 🥇 Meilleures rentabilités

| Ville | Rendement brut | Prix moyen/m² |
|-------|----------------|---------------|
| Saint-Étienne | 8-10% | 1 100€ |
| Mulhouse | 7-9% | 1 200€ |
| Le Havre | 6-8% | 2 100€ |
| Limoges | 6-7% | 1 400€ |

### 🏆 Meilleur équilibre rendement/sécurité

| Ville | Rendement brut | Tension locative |
|-------|----------------|------------------|
| Rennes | 4-5% | Très forte |
| Nantes | 4-5% | Très forte |
| Bordeaux | 3.5-4.5% | Forte |
| Lyon | 3-4% | Très forte |

### 📈 Villes en progression

- **Angers** : +15% en 3 ans, demande étudiante forte
- **Orléans** : Proximité Paris, prix accessibles
- **Reims** : TGV Paris 45min, université importante

> 💡 **Conseil** : Privilégiez les villes avec une **demande locative forte** et une **économie diversifiée**.

Quelle ville vous intéresse ?`
};

function getMockResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('rentabil') || lowerMessage.includes('rendement') || lowerMessage.includes('cash')) {
    return MOCK_RESPONSES.rentabilite;
  }
  if (lowerMessage.includes('fiscal') || lowerMessage.includes('lmnp') || lowerMessage.includes('impot') || lowerMessage.includes('impôt')) {
    return MOCK_RESPONSES.fiscalite;
  }
  if (lowerMessage.includes('ville') || lowerMessage.includes('où investir') || lowerMessage.includes('region') || lowerMessage.includes('région')) {
    return MOCK_RESPONSES.villes;
  }
  
  return MOCK_RESPONSES.default;
}

export async function* streamMockResponse(message) {
  const response = getMockResponse(message);
  const words = response.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
    yield words.slice(0, i + 1).join(' ');
  }
}

export async function* streamApiResponse(message, apiEndpoint, conversationHistory = []) {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Vérifier si la réponse est du JSON (backend Python) ou du streaming
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      // Backend retourne du JSON (non-streaming)
      const data = await response.json();
      const reply = data.reply || data.message || data.content || '';
      
      // Simuler le streaming pour l'UX
      const words = reply.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        yield words.slice(0, i + 1).join(' ');
      }
    } else {
      // Streaming classique
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullContent += chunk;
        yield fullContent;
      }
    }
  } catch (error) {
    yield `❌ **Erreur de connexion au serveur**\n\nImpossible de joindre l'API : \`${apiEndpoint}\`\n\n> Vérifiez que votre backend est en cours d'exécution ou activez le **Mode Mock** dans les paramètres.\n\nDétails: ${error.message}`;
  }
}

export async function generateTitle(message) {
  // Génère un titre basé sur le premier message
  const words = message.split(' ').slice(0, 6).join(' ');
  return words.length > 30 ? words.substring(0, 30) + '...' : words;
}
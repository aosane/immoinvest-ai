import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

        // Récupérer l'URL du backend Python depuis les variables d'environnement
        const pythonBackendUrl = Deno.env.get('PYTHON_BACKEND_URL') || 'http://localhost:8000';
        
        // Appeler le backend Python FastAPI
        const response = await fetch(`${pythonBackendUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                history: history || []
            }),
            signal: AbortSignal.timeout(90000), // timeout 90s
        });

        if (!response.ok) {
            const errorText = await response.text();
            return Response.json({ 
                error: `Erreur backend Python: ${response.status}`,
                details: errorText 
            }, { status: response.status });
        }

        const data = await response.json();

        // Le backend Python retourne: { reply, action?, data? }
        return Response.json({
            reply: data.reply || '',
            action: data.action || null,
            data: data.data || null,
        });

    } catch (error) {
        console.error('Erreur chatWithMistral:', error);
        
        if (error.name === 'TimeoutError') {
            return Response.json({ 
                error: 'Le backend Python met trop de temps à répondre (timeout 90s)'
            }, { status: 504 });
        }

        return Response.json({ 
            error: error.message || 'Erreur interne',
            details: 'Vérifiez que votre backend Python FastAPI est bien lancé'
        }, { status: 500 });
    }
});
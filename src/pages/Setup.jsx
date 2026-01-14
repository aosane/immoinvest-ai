import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Terminal,
  Play,
  CheckCircle2,
  Copy,
  ExternalLink,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function Setup() {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="w-full px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 
                          flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white">Installation Backend</h1>
              <p className="text-xs text-slate-400">Guide de configuration Python</p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Introduction */}
          <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Terminal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Backend Python FastAPI</CardTitle>
                  <CardDescription>
                    Agent autonome d'investissement immobilier avec scraping MeilleursAgents + LLM Ollama
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Prérequis</AlertTitle>
                <AlertDescription>
                  Python 3.9+, Ollama installé localement avec le modèle Mistral
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 1: Dependencies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold">
                  1
                </span>
                Installer les dépendances Python
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">requirements.txt</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`fastapi
uvicorn[standard]
pydantic
requests
pandas
lxml
html5lib
beautifulsoup4`)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-slate-100 text-sm">{`fastapi
uvicorn[standard]
pydantic
requests
pandas
lxml
html5lib
beautifulsoup4`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Installation</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('pip install -r requirements.txt')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4">
                  <code className="text-green-400 text-sm">$ pip install -r requirements.txt</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Ollama */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold">
                  2
                </span>
                Installer et démarrer Ollama
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Téléchargez Ollama depuis le site officiel :
                </p>
                <a
                  href="https://ollama.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:underline"
                >
                  https://ollama.com/download
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Télécharger le modèle Mistral</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('ollama pull mistral')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4">
                  <code className="text-green-400 text-sm">$ ollama pull mistral</code>
                </div>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Ollama doit tourner en arrière-plan sur le port 11434 (par défaut)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 3: Launch backend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold">
                  3
                </span>
                Lancer le serveur backend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sauvegardez votre script Python (ex: <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">main.py</code>) puis lancez :
                </p>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('uvicorn main:app --reload --host 0.0.0.0 --port 8000')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4">
                  <code className="text-green-400 text-sm">$ uvicorn main:app --reload --host 0.0.0.0 --port 8000</code>
                </div>
              </div>

              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-200">Serveur prêt</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Votre backend sera accessible sur <code className="px-1 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs">http://localhost:8000</code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 4: Configure frontend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold">
                  4
                </span>
                Configurer le frontend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Allez dans les Paramètres et configurez l'URL de l'API :
              </p>

              <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    URL de l'endpoint API
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('http://localhost:8000/chat')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 font-mono text-sm text-slate-700 dark:text-slate-300">
                  http://localhost:8000/chat
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>N'oubliez pas de désactiver le Mode Mock</span>
                </div>
              </div>

              <Link to={createPageUrl('Settings')}>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  <Terminal className="w-4 h-4 mr-2" />
                  Aller aux Paramètres
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Structure de l'API</CardTitle>
              <CardDescription>Format des requêtes/réponses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Requête</h3>
                <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-slate-100 text-sm">{`POST /chat
Content-Type: application/json

{
  "message": "Je veux investir à Bordeaux"
}`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Réponse</h3>
                <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-slate-100 text-sm">{`{
  "reply": "Message de l'assistant...",
  "action": "city_snapshot",
  "data": { ... }
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test */}
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                Prêt à tester
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Une fois le backend lancé et configuré, testez avec des questions comme :
              </p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>"Je veux investir à Bordeaux 33000"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>"Quel est le meilleur arrondissement de Paris pour investir ?"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>"Analyse Marseille 13001"</span>
                </li>
              </ul>

              <Link to={createPageUrl('Chat')} className="block mt-6">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Tester le chat
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
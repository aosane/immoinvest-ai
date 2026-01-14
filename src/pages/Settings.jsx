import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Zap, 
  Server, 
  Save, 
  CheckCircle,
  Building2,
  ExternalLink,
  Code,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();
  
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
  });

  const settings = settingsData?.[0];

  const [formData, setFormData] = useState({
    mock_mode: true,
    api_endpoint: '',
    theme: 'light'
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        mock_mode: settings.mock_mode ?? true,
        api_endpoint: settings.api_endpoint || '',
        theme: settings.theme || 'light'
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings) {
        return base44.entities.Settings.update(settings.id, data);
      } else {
        return base44.entities.Settings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      toast.success('Paramètres enregistrés');
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="w-full px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Chat')}>
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
              <h1 className="font-bold text-slate-800 dark:text-white">Paramètres</h1>
              <p className="text-xs text-slate-400">Configuration de l'application</p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-8">
        <Tabs defaultValue="backend" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1">
            <TabsTrigger value="backend" className="data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-900/20">
              <Server className="w-4 h-4 mr-2" />
              Backend
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-900/20">
              <Code className="w-4 h-4 mr-2" />
              Documentation API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="backend">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Mock Mode Card */}
              <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Mode Mock Backend</CardTitle>
                      <CardDescription>
                        Testez l'application sans backend réel
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="mock-mode" className="text-base font-medium">
                        Activer le mode Mock
                      </Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Utilise des réponses simulées pour tester l'interface
                      </p>
                    </div>
                    <Switch
                      id="mock-mode"
                      checked={formData.mock_mode}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, mock_mode: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* API Endpoint Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Server className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Configuration API</CardTitle>
                      <CardDescription>
                        Connectez votre backend personnalisé
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-endpoint">URL de l'endpoint API</Label>
                    <Input
                      id="api-endpoint"
                      placeholder="http://localhost:8000/chat"
                      value={formData.api_endpoint}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
                      disabled={formData.mock_mode}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Endpoint backend Python FastAPI (accepte POST JSON)
                    </p>
                  </div>

                  <Link to={createPageUrl('Setup')}>
                    <Button variant="outline" className="w-full">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Guide d'installation du backend Python
                    </Button>
                  </Link>

                  {formData.mock_mode && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Mode Mock activé</AlertTitle>
                      <AlertDescription>
                        Désactivez le mode Mock pour utiliser votre propre API
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                >
                  {saved ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Enregistré
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="api">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Documentation API Backend</CardTitle>
                  <CardDescription>
                    Spécifications pour implémenter votre propre backend
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Endpoint</h3>
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4">
                      <code className="text-green-400 text-sm">POST /chat</code>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Requête</h3>
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-slate-100 text-sm">{`{
  "message": "Je veux investir à Bordeaux"
}`}</pre>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Réponse JSON</h3>
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4">
                      <pre className="text-slate-100 text-sm">{`{
  "reply": "Réponse de l'assistant...",
  "action": "city_snapshot",
  "data": {
    "city": "Bordeaux",
    "postal_code": "33000",
    ...
  }
}`}</pre>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-800 dark:text-blue-200">Votre backend Python</AlertTitle>
                    <AlertDescription className="mt-2 text-blue-700 dark:text-blue-300">
                      Le backend supporte les réponses JSON. L'interface simule le streaming pour une meilleure expérience utilisateur.
                      <Link to={createPageUrl('Setup')} className="block mt-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          Voir le guide d'installation complet
                        </Button>
                      </Link>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, Calculator, MapPin, FileText, Sparkles } from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: "Analyse de rentabilité",
    description: "Calcul du rendement brut, net et cash-flow"
  },
  {
    icon: Calculator,
    title: "Simulation fiscale",
    description: "LMNP, LMP, Pinel, déficit foncier..."
  },
  {
    icon: MapPin,
    title: "Conseil géographique",
    description: "Villes à fort potentiel locatif"
  },
  {
    icon: FileText,
    title: "Montage de dossier",
    description: "Financement et négociation bancaire"
  }
];

export default function EmptyState({ onStartConversation }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                        bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30 mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3">
            Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">ImmoInvest AI</span>
          </h1>
          
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Votre assistant expert en investissement locatif immobilier en France
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          {features.map((feature, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
              onClick={() => onStartConversation(feature.title)}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700
                       hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/10
                       transition-all duration-300 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 
                              group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                  <feature.icon className="w-5 h-5 text-slate-600 dark:text-slate-400 
                                         group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Posez votre première question pour commencer
          </p>
        </motion.div>
      </div>
    </div>
  );
}
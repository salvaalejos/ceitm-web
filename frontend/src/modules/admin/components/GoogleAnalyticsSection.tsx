import React from 'react';
import { Activity } from 'lucide-react';
import { AnalyticsWidget } from './AnalyticsWidget';

interface GoogleAnalyticsSectionProps {
  isVisible: boolean;
}

export const GoogleAnalyticsSection: React.FC<GoogleAnalyticsSectionProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <section className="animate-fade-in">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Activity className="text-guinda-600" size={20} /> Métricas de Google Analytics
      </h2>
      <AnalyticsWidget />
    </section>
  );
};
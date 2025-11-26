import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricPoint } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface RealtimeMetricsProps {
  data: MetricPoint[];
}

export const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({ data }) => {
  const { t, theme } = useSettings();
  
  // Determine if dark mode is active (simplified check, for Recharts styles)
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700 shadow-lg flex-1 min-h-[250px] flex flex-col transition-colors duration-300">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wide">{t.metricsTitle}</h2>
        <div className="flex gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></div> {t.inbound}
          </div>
          <div className="flex items-center gap-1.5 text-netty-600 dark:text-netty-400">
            <div className="w-2 h-2 rounded-full bg-netty-500 dark:bg-netty-400 animate-pulse"></div> {t.outbound}
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                borderColor: isDark ? '#334155' : '#e2e8f0', 
                color: isDark ? '#f8fafc' : '#0f172a',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              itemStyle={{ fontSize: 12 }}
            />
            <Area 
              type="monotone" 
              dataKey="inbound" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorIn)" 
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="outbound" 
              stroke="#0ea5e9" 
              fillOpacity={1} 
              fill="url(#colorOut)" 
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
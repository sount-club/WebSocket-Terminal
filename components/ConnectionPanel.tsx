import React from 'react';
import { ConnectionState, ConnectionConfig } from '../types';
import { Power, Radio, ShieldCheck, Activity, Clock, FileJson } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface ConnectionPanelProps {
  config: ConnectionConfig;
  status: ConnectionState;
  onConfigChange: (key: keyof ConnectionConfig, value: any) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  config,
  status,
  onConfigChange,
  onConnect,
  onDisconnect,
}) => {
  const { t } = useSettings();
  const isConnected = status === ConnectionState.CONNECTED;
  const isConnecting = status === ConnectionState.CONNECTING;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-lg transition-colors duration-300">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
        <Radio className="text-netty-600 dark:text-netty-500 w-5 h-5" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t.connectionPanel}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.serverUrl}</label>
          <input
            type="text"
            disabled={isConnected}
            value={config.url}
            onChange={(e) => onConfigChange('url', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-netty-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="ws://localhost:8080/ws"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.authToken}</label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="password"
              disabled={isConnected}
              value={config.token}
              onChange={(e) => onConfigChange('token', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-netty-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="JWT Token..."
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <label className="flex items-center gap-2 cursor-pointer mb-3 select-none">
            <input
              type="checkbox"
              checked={config.enableHeartbeat}
              onChange={(e) => onConfigChange('enableHeartbeat', e.target.checked)}
              className="rounded bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-netty-600 focus:ring-offset-0 focus:ring-0"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Activity className="w-3 h-3" /> {t.enableHeartbeat}
            </span>
          </label>

          {config.enableHeartbeat && (
            <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                   <label className="block text-[10px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                     <Clock className="w-3 h-3" /> {t.interval}
                   </label>
                   <input
                    type="number"
                    value={config.heartbeatInterval}
                    onChange={(e) => onConfigChange('heartbeatInterval', parseInt(e.target.value) || 1000)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-netty-500 outline-none text-right font-mono"
                  />
                </div>
                <div className="col-span-2">
                   <label className="block text-[10px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                     <FileJson className="w-3 h-3" /> {t.payload}
                   </label>
                   <input
                    type="text"
                    value={config.heartbeatMessage}
                    onChange={(e) => onConfigChange('heartbeatMessage', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-slate-300 focus:ring-2 focus:ring-netty-500 outline-none font-mono"
                    placeholder='{"type":"PING"}'
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
            <button
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={isConnecting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded font-medium transition-all shadow-md active:scale-[0.98] ${
                isConnected
                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/50'
                : 'bg-netty-600 text-white hover:bg-netty-500 shadow-netty-500/20'
            }`}
            >
            <Power className="w-4 h-4" />
            {isConnected ? t.disconnect : isConnecting ? t.connecting : t.connect}
            </button>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">{t.status}</span>
            <span className={`font-mono font-bold ${
              isConnected ? 'text-green-500 dark:text-green-400' : 
              status === ConnectionState.ERROR ? 'text-red-500 dark:text-red-400' : 'text-slate-500'
            }`}>
              {status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
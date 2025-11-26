
import React, { useState, useEffect } from 'react';
import { Book, Save, Plus, Trash2, Edit2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { ProtocolSpecItem } from '../types';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../services/storage';

const DEFAULT_SPECS: ProtocolSpecItem[] = [
  { id: '1', label: 'Ping', color: 'text-netty-600', format: '{"type":"PING"}' },
  { id: '2', label: 'Auth', color: 'text-amber-600', format: '{"type":"AUTH","token":"..."}' },
  { id: '3', label: 'Msg', color: 'text-emerald-600', format: '{"type":"MESSAGE","content":"..."}' }
];

export const ProtocolSpec: React.FC = () => {
  const { t } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [specs, setSpecs] = useState<ProtocolSpecItem[]>(DEFAULT_SPECS);

  // Load specs from storage on mount
  useEffect(() => {
    const saved = loadFromStorage(STORAGE_KEYS.PROTOCOL_SPEC, DEFAULT_SPECS);
    setSpecs(saved);
  }, []);

  const handleSave = () => {
    saveToStorage(STORAGE_KEYS.PROTOCOL_SPEC, specs);
    setIsEditing(false);
  };

  const updateSpec = (id: string, field: keyof ProtocolSpecItem, value: string) => {
    setSpecs(specs.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSpec = () => {
    const newSpec: ProtocolSpecItem = {
      id: Date.now().toString(),
      label: 'New',
      color: 'text-slate-600',
      format: '{}'
    };
    setSpecs([...specs, newSpec]);
  };

  const removeSpec = (id: string) => {
    setSpecs(specs.filter(s => s.id !== id));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Book className="w-3 h-3" /> {t.protoSpec}
        </h3>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
            isEditing 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
              : 'text-slate-400 hover:text-netty-600 dark:hover:text-slate-200'
          }`}
        >
          {isEditing ? <Save className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
          {isEditing ? t.save : t.editSpec}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {specs.map((spec) => (
          <div key={spec.id} className="text-xs group">
            {isEditing ? (
              <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                <input 
                  value={spec.label}
                  onChange={(e) => updateSpec(spec.id, 'label', e.target.value)}
                  className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1 text-slate-700 dark:text-slate-200"
                  placeholder="Label"
                />
                 <input 
                  value={spec.format}
                  onChange={(e) => updateSpec(spec.id, 'format', e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1 font-mono text-slate-700 dark:text-slate-200"
                  placeholder="{}"
                />
                <button onClick={() => removeSpec(spec.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 pb-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <span className={`font-bold w-12 shrink-0 ${spec.color.replace('text-', 'text-opacity-90 dark:text-opacity-100 dark:text-')}`}>{spec.label}:</span>
                <code className="font-mono text-slate-600 dark:text-slate-400 break-all">{spec.format}</code>
              </div>
            )}
          </div>
        ))}
        {isEditing && (
          <button 
            onClick={addSpec}
            className="w-full py-1 text-xs text-slate-400 hover:text-netty-600 border border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" /> {t.newPreset}
          </button>
        )}
      </div>
    </div>
  );
};

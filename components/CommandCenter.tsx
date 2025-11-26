
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Save, Trash2, Zap, Play, Square, Plus, Pencil, ChevronDown, Braces, AlertCircle, FileCode } from 'lucide-react';
import { MessageType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../services/storage';

interface CommandCenterProps {
  onSendMessage: (type: MessageType, content: string) => void;
  disabled: boolean;
}

interface Macro {
  id: string;
  name: string;
  type: MessageType;
  content: string;
}

const DEFAULT_MACROS: Macro[] = [
  { id: '1', name: 'Login JSON', type: MessageType.JSON, content: '{"action":"LOGIN","uid":1001}' },
  { id: '2', name: 'Ping Text', type: MessageType.TEXT, content: 'PING' }
];

export const CommandCenter: React.FC<CommandCenterProps> = ({ onSendMessage, disabled }) => {
  const { t } = useSettings();
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<MessageType>(MessageType.JSON);
  
  // Macros State
  const [macros, setMacros] = useState<Macro[]>(DEFAULT_MACROS);
  const [newMacroName, setNewMacroName] = useState('');
  const [showSaveMacro, setShowSaveMacro] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formatting Error State
  const [formatError, setFormatError] = useState(false);

  // Stress Test State
  const [showStress, setShowStress] = useState(false);
  const [stressCount, setStressCount] = useState(100);
  const [stressInterval, setStressInterval] = useState(50);
  const [isStressing, setIsStressing] = useState(false);
  const [stressProgress, setStressProgress] = useState(0);
  const stressTimerRef = useRef<any>(null);

  // Load Macros from Storage
  useEffect(() => {
    const saved = loadFromStorage(STORAGE_KEYS.MACROS, DEFAULT_MACROS);
    setMacros(saved);
  }, []);

  // Clear format error on type
  useEffect(() => {
    if (formatError) setFormatError(false);
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(mode, message);
    if (!isStressing) setMessage(''); 
  };

  const handleFormat = () => {
    if (!message.trim()) return;
    
    try {
        if (mode === MessageType.JSON) {
            const obj = JSON.parse(message);
            setMessage(JSON.stringify(obj, null, 2));
        } else if (mode === MessageType.XML) {
            // Basic XML formatter
            let formatted = '';
            let pad = 0;
            const xml = message.replace(/>\s*</g, '><'); // remove existing whitespace between tags
            xml.split(/>\s*</).forEach(node => {
                if (node.match(/^\/\w/)) pad -= 1;
                else if (node.match(/^<?\w[^>]*[^\/]$/)) pad += 1;
                
                let indent = '';
                for (let i = 0; i < pad; i++) indent += '  ';
                
                // Correction for first and last splits
                let part = node;
                if (!part.startsWith('<')) part = '<' + part;
                if (!part.endsWith('>')) part = part + '>';
                
                // Fix double brackets if split logic duplicated them (naive split fix)
                // Actually regex split removes delimiters usually.
                // Let's rely on a simpler regex match approach for robustness
            });

            // Fallback simpler XML pretty print for now
            const PADDING = '  ';
            const reg = /(>)(<)(\/*)/g;
            let padAmt = 0;
            const xmlStr = message.replace(reg, '$1\r\n$2$3');
            let result = '';
            xmlStr.split('\r\n').forEach((node) => {
                let indent = 0;
                if (node.match(/.+<\/\w[^>]*>$/)) {
                    indent = 0;
                } else if (node.match(/^<\/\w/)) {
                    if (padAmt !== 0) padAmt -= 1;
                } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                    indent = 1;
                } else {
                    indent = 0;
                }

                let padding = '';
                for (let i = 0; i < padAmt; i++) padding += PADDING;
                result += padding + node + '\r\n';
                padAmt += indent;
            });
            setMessage(result.trim());
        }
        setFormatError(false);
    } catch (e) {
        setFormatError(true);
        setTimeout(() => setFormatError(false), 2000);
    }
  };

  const getPlaceholder = () => {
      switch(mode) {
          case MessageType.JSON: return t.placeholderJson;
          case MessageType.XML: return t.placeholderXml;
          case MessageType.BINARY: return t.placeholderBinary;
          default: return t.placeholderText;
      }
  }

  // Macro Logic
  const saveMacro = () => {
    if (!newMacroName.trim() || !message.trim()) return;

    let updatedMacros;
    if (editingId) {
      updatedMacros = macros.map(m => m.id === editingId ? {
        ...m,
        name: newMacroName,
        type: mode,
        content: message
      } : m);
      setEditingId(null);
    } else {
      const newMacro: Macro = {
        id: Date.now().toString(),
        name: newMacroName,
        type: mode,
        content: message
      };
      updatedMacros = [...macros, newMacro];
    }

    setMacros(updatedMacros);
    saveToStorage(STORAGE_KEYS.MACROS, updatedMacros);
    setNewMacroName('');
    setShowSaveMacro(false);
  };

  const deleteMacro = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = macros.filter(m => m.id !== id);
    setMacros(updated);
    saveToStorage(STORAGE_KEYS.MACROS, updated);
    
    if (editingId === id) {
      setEditingId(null);
      setShowSaveMacro(false);
      setNewMacroName('');
    }
  };

  const startEditMacro = (m: Macro, e: React.MouseEvent) => {
    e.stopPropagation();
    setMode(m.type);
    setMessage(m.content);
    setNewMacroName(m.name);
    setEditingId(m.id);
    setShowSaveMacro(true);
  };

  const toggleSaveForm = () => {
    if (showSaveMacro) {
      setShowSaveMacro(false);
      setEditingId(null);
      setNewMacroName('');
    } else {
      setShowSaveMacro(true);
      setEditingId(null);
      setNewMacroName('');
    }
  };

  const loadMacro = (m: Macro) => {
    if (editingId === m.id) return; 
    setMode(m.type);
    setMessage(m.content);
  };

  // Stress Test Logic
  const startStressTest = () => {
    if (!message.trim()) return;
    setIsStressing(true);
    setStressProgress(0);
    
    let sent = 0;
    stressTimerRef.current = setInterval(() => {
      if (sent >= stressCount) {
        stopStressTest();
        return;
      }
      onSendMessage(mode, message);
      sent++;
      setStressProgress(Math.round((sent / stressCount) * 100));
    }, stressInterval);
  };

  const stopStressTest = () => {
    if (stressTimerRef.current) clearInterval(stressTimerRef.current);
    setIsStressing(false);
    setStressProgress(100);
  };

  useEffect(() => {
    return () => {
      if (stressTimerRef.current) clearInterval(stressTimerRef.current);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col gap-2 transition-colors duration-300 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-netty-600 dark:text-netty-500 w-4 h-4" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.commandCenter}</h2>
        </div>
        
        {/* Tool Toggles */}
        <button 
            onClick={() => setShowStress(!showStress)}
            className={`p-1 rounded transition-colors ${showStress ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title={t.stressMode}
        >
            <Zap className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Macros Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {macros.map(m => (
            <div 
              key={m.id}
              onClick={() => loadMacro(m)}
              className={`group flex items-center gap-2 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-900 border rounded-full text-[10px] font-mono cursor-pointer transition-all select-none
                ${editingId === m.id 
                  ? 'border-netty-500 text-netty-600 dark:text-white ring-1 ring-netty-500/50' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-netty-500 hover:text-netty-600 dark:hover:text-white'
                }`}
            >
              <span className={m.type === MessageType.JSON ? 'text-amber-600 dark:text-amber-500' : ''}>{m.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity border-l border-slate-300 dark:border-slate-700 pl-1.5 ml-1">
                <span onClick={(e) => startEditMacro(m, e)} className="hover:text-netty-500 transition-colors p-0.5" title={t.editPreset}>
                  <Pencil className="w-2.5 h-2.5" />
                </span>
                <span onClick={(e) => deleteMacro(m.id, e)} className="hover:text-red-500 transition-colors p-0.5" title={t.delete}>
                  <Trash2 className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          ))}
          <button 
            onClick={toggleSaveForm}
            className={`px-2 py-0.5 rounded-full text-[10px] border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-netty-600 hover:border-netty-500 flex items-center gap-1 transition-colors ${showSaveMacro ? 'bg-slate-100 dark:bg-slate-800 text-netty-600' : ''}`}
          >
            <Plus className="w-2.5 h-2.5" /> {t.newPreset}
          </button>
        </div>
      </div>

      {/* Save Macro Inline Form */}
      {showSaveMacro && (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded border border-slate-200 dark:border-slate-600 animate-in fade-in slide-in-from-top-1">
          <input 
             type="text"
             value={newMacroName}
             onChange={(e) => setNewMacroName(e.target.value)}
             placeholder={t.presetName}
             className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-netty-500 outline-none text-slate-900 dark:text-white"
             autoFocus
          />
          <button 
            onClick={saveMacro}
            disabled={!newMacroName || !message}
            className="bg-netty-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-netty-500 disabled:opacity-50 font-medium whitespace-nowrap"
          >
            <Save className="w-3 h-3" /> 
            {editingId ? t.update : t.save}
          </button>
        </div>
      )}

      {/* Stress Tester Panel */}
      {showStress && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-2 animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center gap-4 mb-2">
             <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-xs font-bold uppercase tracking-wider">
               <Zap className="w-3 h-3" /> {t.stressMode}
             </div>
             {isStressing && (
               <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${stressProgress}%`}} />
               </div>
             )}
           </div>
           
           <div className="flex items-end gap-2">
             <div>
               <label className="block text-[10px] text-slate-500 mb-0.5">{t.count}</label>
               <input 
                 type="number" 
                 value={stressCount}
                 onChange={(e) => setStressCount(Number(e.target.value))}
                 className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-right font-mono focus:ring-1 focus:ring-amber-500 outline-none text-slate-900 dark:text-white" 
               />
             </div>
             <div>
               <label className="block text-[10px] text-slate-500 mb-0.5">{t.interval} (ms)</label>
               <input 
                 type="number" 
                 value={stressInterval}
                 onChange={(e) => setStressInterval(Number(e.target.value))}
                 className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-right font-mono focus:ring-1 focus:ring-amber-500 outline-none text-slate-900 dark:text-white" 
               />
             </div>
             <button
               onClick={isStressing ? stopStressTest : startStressTest}
               disabled={disabled || !message}
               className={`flex-1 flex items-center justify-center gap-2 py-1 rounded text-xs font-bold uppercase tracking-wide transition-all ${
                 isStressing 
                   ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/30' 
                   : 'bg-amber-500 text-white hover:bg-amber-400 shadow-lg shadow-amber-600/20'
               } ${(!message || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {isStressing ? <><Square className="w-3 h-3" /> {t.stop}</> : <><Play className="w-3 h-3" /> {t.startBlast}</>}
             </button>
           </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex flex-col gap-2 relative flex-1 min-h-[120px]">
        {/* Toolbar */}
        <div className="absolute top-2 left-2 right-2 z-10 flex justify-between pointer-events-none">
          {/* Type Selector */}
          <div className="pointer-events-auto relative group shadow-sm">
            <select
                value={mode}
                onChange={(e) => setMode(e.target.value as MessageType)}
                className="appearance-none pl-2 pr-7 py-1 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-netty-500 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors uppercase tracking-wide"
            >
                <option value={MessageType.JSON}>{t.typeJson}</option>
                <option value={MessageType.TEXT}>{t.typeText}</option>
                <option value={MessageType.XML}>{t.typeXml}</option>
                <option value={MessageType.BINARY}>{t.typeBinary}</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Format Button */}
          {(mode === MessageType.JSON || mode === MessageType.XML) && (
             <button 
                onClick={handleFormat}
                className={`pointer-events-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border shadow-sm transition-all
                  ${formatError 
                     ? 'bg-red-100 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' 
                     : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                title={t.format}
             >
                {formatError ? <AlertCircle className="w-3 h-3" /> : <Braces className="w-3 h-3" />}
                {formatError ? t.formatError : t.format}
             </button>
          )}
        </div>

        <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled || isStressing}
            placeholder={getPlaceholder()}
            className={`w-full h-full resize-none bg-slate-50 dark:bg-slate-900 border rounded-lg pl-3 pt-10 pr-3 pb-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-netty-500 outline-none disabled:opacity-50 font-mono transition-colors leading-relaxed ${editingId ? 'border-netty-500 ring-1 ring-netty-500/20' : 'border-slate-200 dark:border-slate-700'} ${(mode === MessageType.JSON || mode === MessageType.XML) ? 'text-amber-700 dark:text-amber-400' : ''}`}
        />
        
        <div className="absolute bottom-3 right-3">
             <button
                onClick={(e) => handleSubmit(e)}
                disabled={disabled || !message.trim() || isStressing}
                className="bg-netty-600 hover:bg-netty-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-3 h-3" />
                {t.send}
            </button>
        </div>
      </div>
    </div>
  );
};

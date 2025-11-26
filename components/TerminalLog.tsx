
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { WSMessage, MessageType } from '../types';
import { Terminal, ArrowDown, ArrowUp, Search, X, Trash2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface TerminalLogProps {
  messages: WSMessage[];
  clearLogs: () => void;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ messages, clearLogs }) => {
  const { t } = useSettings();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [filterText, setFilterText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  // Filter messages based on search text
  const filteredMessages = useMemo(() => {
    if (!filterText) return messages;
    const lowerFilter = filterText.toLowerCase();
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(lowerFilter) || 
      msg.type.toLowerCase().includes(lowerFilter)
    );
  }, [messages, filterText]);

  // Handle scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, autoScroll]);

  const getTypeColor = (type: MessageType) => {
    switch (type) {
      case MessageType.HEARTBEAT_PING:
      case MessageType.HEARTBEAT_PONG:
        return 'text-slate-400 dark:text-slate-500';
      case MessageType.AUTH:
        return 'text-amber-600 dark:text-amber-400';
      case MessageType.ERROR:
        return 'text-red-600 dark:text-red-400';
      case MessageType.SYSTEM:
        return 'text-green-600 dark:text-green-400';
      case MessageType.JSON:
        return 'text-netty-600 dark:text-netty-300';
      case MessageType.XML:
        return 'text-orange-600 dark:text-orange-300';
      case MessageType.BINARY:
        return 'text-purple-600 dark:text-purple-300';
      default:
        return 'text-slate-700 dark:text-slate-200';
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight > 50) {
      setAutoScroll(false);
    } else {
      setAutoScroll(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col h-[500px] transition-colors duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-mono text-slate-700 dark:text-slate-300 hidden sm:inline font-bold">
            {t.terminalTitle}
          </span>
          {messages.length > 0 && (
             <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500 px-2 py-0.5 rounded-full font-mono">
               {filteredMessages.length}/{messages.length}
             </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
          <div className="relative group flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-netty-500 transition-colors" />
            <input 
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-2 focus:ring-netty-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
            {filterText && (
              <button 
                onClick={() => setFilterText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button 
            onClick={clearLogs}
            className="flex items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs font-medium border border-red-200 dark:border-red-900/50 shadow-sm"
          >
            <Trash2 className="w-3 h-3" />
            {t.clearLogs}
          </button>
        </div>
      </div>
      
      {/* Logs Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent"
        onScroll={handleScroll}
      >
        {filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 italic gap-2">
            <Search className="w-8 h-8 opacity-20" />
            <span>{messages.length === 0 ? t.noLogs : t.noMatches}</span>
          </div>
        )}
        {filteredMessages.map((msg) => (
          <div key={msg.id} className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded transition-colors group">
            <span className="text-slate-400 dark:text-slate-600 shrink-0 select-none w-[85px]">
              {new Date(msg.timestamp).toLocaleTimeString().split(' ')[0]}
              <span className="text-[10px] ml-1 opacity-60">.{new Date(msg.timestamp).getMilliseconds().toString().padStart(3, '0')}</span>
            </span>
            <span className={`shrink-0 flex items-center gap-1 w-16 font-semibold ${msg.isOutgoing ? 'text-netty-600 dark:text-netty-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
              {msg.isOutgoing ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {msg.isOutgoing ? 'OUT' : 'IN'}
            </span>
            <span className={`shrink-0 w-16 font-bold ${getTypeColor(msg.type)}`}>
              [{msg.type}]
            </span>
            <span className="text-slate-700 dark:text-slate-300 break-all whitespace-pre-wrap group-hover:text-black dark:group-hover:text-white transition-colors">
              {msg.content}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

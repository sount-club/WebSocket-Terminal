
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionState, ConnectionConfig, WSMessage, MessageType, MetricPoint } from './types';
import { ConnectionPanel } from './components/ConnectionPanel';
import { RealtimeMetrics } from './components/RealtimeMetrics';
import { TerminalLog } from './components/TerminalLog';
import { CommandCenter } from './components/CommandCenter';
import { MockNettyServer } from './services/mockServer';
import { LayoutDashboard, Moon, Sun, Monitor, Languages } from 'lucide-react';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './services/storage';

const DEFAULT_CONFIG: ConnectionConfig = {
  url: 'ws://localhost:8080/ws',
  token: '',
  enableHeartbeat: true,
  heartbeatInterval: 30000,
  heartbeatMessage: '{"type":"PING"}',
};

function AppContent() {
  const { t, theme, setTheme, language, setLanguage } = useSettings();
  
  // State
  const [config, setConfig] = useState<ConnectionConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const mockServerRef = useRef<MockNettyServer | null>(null);
  const heartbeatTimerRef = useRef<any>(null);
  const metricsTimerRef = useRef<any>(null);
  const messageCountRef = useRef({ in: 0, out: 0 });

  // Load Config
  useEffect(() => {
    const savedConfig = loadFromStorage(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    setConfig(savedConfig);
  }, []);

  // Update metrics chart
  useEffect(() => {
    metricsTimerRef.current = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      
      setMetrics(prev => {
        const newPoint = {
          time: timeStr,
          inbound: messageCountRef.current.in,
          outbound: messageCountRef.current.out,
          latency: Math.floor(Math.random() * 10) + 5,
        };
        const newData = [...prev, newPoint];
        if (newData.length > 20) newData.shift();
        return newData;
      });

      messageCountRef.current = { in: 0, out: 0 };
    }, 1000);

    return () => clearInterval(metricsTimerRef.current);
  }, []);

  const addMessage = useCallback((msg: Omit<WSMessage, 'id' | 'timestamp'>) => {
    const newMsg: WSMessage = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newMsg]);
    
    if (msg.isOutgoing) {
      messageCountRef.current.out++;
    } else {
      messageCountRef.current.in++;
    }
  }, []);

  const handleConfigChange = (key: keyof ConnectionConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    saveToStorage(STORAGE_KEYS.CONFIG, newConfig);
  };

  const connect = useCallback(() => {
    setStatus(ConnectionState.CONNECTING);
    addMessage({ type: MessageType.SYSTEM, content: `Attempting connection to ${config.url}...`, isOutgoing: true });

    if (wsRef.current) wsRef.current.close();
    if (mockServerRef.current) mockServerRef.current.disconnect();

    try {
      if (config.url.includes('mock')) {
        throw new Error("Force mock");
      }

      const socket = new WebSocket(config.url);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus(ConnectionState.CONNECTED);
        addMessage({ type: MessageType.SYSTEM, content: 'Connection Established', isOutgoing: false });
        
        if (config.token) {
           const authMsg = { type: MessageType.AUTH, token: config.token };
           socket.send(JSON.stringify(authMsg));
           addMessage({ type: MessageType.AUTH, content: `Bearer ${config.token.substring(0,5)}...`, isOutgoing: true });
        }
      };

      socket.onmessage = (event) => {
        try {
          // Attempt to detect type if JSON, otherwise default to TEXT
          let type = MessageType.TEXT;
          let content = event.data;
          
          if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
             type = MessageType.JSON;
          }
          
          // Legacy handling for Mock Server envelopes
          try {
             const data = JSON.parse(content);
             if (data.type && (data.type === 'MESSAGE' || data.type === 'BROADCAST')) {
                if (data.type) {
                    type = MessageType.JSON; // It's JSON regardless
                }
             }
          } catch(e) {}

          addMessage({ 
            type: type, 
            content: content, 
            isOutgoing: false 
          });
        } catch (e) {
          addMessage({ type: MessageType.TEXT, content: event.data, isOutgoing: false });
        }
      };

      socket.onclose = () => {
        setStatus(ConnectionState.DISCONNECTED);
        addMessage({ type: MessageType.SYSTEM, content: 'Connection Closed', isOutgoing: false });
        stopHeartbeat();
      };

      socket.onerror = () => {
        setStatus(ConnectionState.ERROR);
        addMessage({ type: MessageType.ERROR, content: 'Network Error', isOutgoing: false });
      };

    } catch (e) {
      console.log("Using Mock Server");
      const mock = new MockNettyServer();
      mockServerRef.current = mock;
      
      mock.connect((data) => {
        // Mock server sends raw JSON strings
        try {
            const parsed = JSON.parse(data);
            // Translate legacy mock types to new display types
            let type = MessageType.JSON;
            if (parsed.type === 'SYSTEM') type = MessageType.SYSTEM;
            if (parsed.type === 'AUTH') type = MessageType.AUTH;
            
            addMessage({ 
                type: type, 
                content: typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed), 
                isOutgoing: false 
            });
        } catch(e) {
             addMessage({ 
                type: MessageType.TEXT, 
                content: data, 
                isOutgoing: false 
            });
        }
      });

      setStatus(ConnectionState.CONNECTED);
      if (config.token) {
        mock.send(JSON.stringify({ type: 'AUTH', content: config.token }));
        addMessage({ type: MessageType.AUTH, content: `Bearer ${config.token.substring(0, 5)}...`, isOutgoing: true });
      }
    }
  }, [config, addMessage]);

  const disconnect = () => {
    if (wsRef.current) wsRef.current.close();
    if (mockServerRef.current) mockServerRef.current.disconnect();
    setStatus(ConnectionState.DISCONNECTED);
    stopHeartbeat();
  };

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    
    heartbeatTimerRef.current = setInterval(() => {
      if (status !== ConnectionState.CONNECTED) return;
      
      const pingMsg = config.heartbeatMessage;
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(pingMsg);
      } else if (mockServerRef.current) {
        mockServerRef.current.send(pingMsg);
      }
      
      addMessage({ 
        type: MessageType.HEARTBEAT_PING, 
        content: pingMsg, 
        isOutgoing: true 
      });
      
    }, config.heartbeatInterval);
  }, [status, config.heartbeatInterval, config.heartbeatMessage, addMessage]);

  const stopHeartbeat = () => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
  };

  useEffect(() => {
    if (config.enableHeartbeat && status === ConnectionState.CONNECTED) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
  }, [config.enableHeartbeat, status, startHeartbeat]);


  const handleSendMessage = (type: MessageType, content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(content);
    } else if (mockServerRef.current) {
      mockServerRef.current.send(content);
    } else {
      if (status === ConnectionState.CONNECTED) {
          addMessage({ type: MessageType.ERROR, content: 'Socket not open, message failed.', isOutgoing: false });
      }
      return;
    }

    addMessage({ type, content, isOutgoing: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-sm z-20 h-[64px] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-netty-500 to-netty-700 rounded-lg flex items-center justify-center shadow-lg shadow-netty-500/20">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">
              {t.appTitle}
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 hidden sm:block opacity-80">{t.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Language Toggle */}
           <button 
             onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
             className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-netty-600 dark:hover:text-netty-400 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded transition-colors uppercase tracking-wider"
           >
             <Languages className="w-3 h-3" />
             {language === 'en' ? 'EN' : 'CN'}
           </button>

           {/* Theme Toggle */}
           <div className="flex bg-slate-100 dark:bg-slate-800 rounded p-0.5 border border-slate-200 dark:border-slate-700">
              <button onClick={() => setTheme('light')} className={`p-1.5 rounded transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-netty-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setTheme('system')} className={`p-1.5 rounded transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-netty-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setTheme('dark')} className={`p-1.5 rounded transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-netty-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Moon className="w-3.5 h-3.5" />
              </button>
           </div>
        </div>
      </header>

      {/* Main Content - Grid Layout */}
      <main className="flex-1 p-4 overflow-hidden h-[calc(100vh-64px)]">
        <div className="max-w-[1920px] w-full mx-auto grid grid-cols-12 gap-4 h-full">
          
          {/* Left Column: Sidebar (Connection + Metrics) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
            <ConnectionPanel 
              config={config} 
              status={status}
              onConfigChange={handleConfigChange}
              onConnect={connect}
              onDisconnect={disconnect}
            />
            <RealtimeMetrics data={metrics} />
          </div>

          {/* Right Column: Workspace (Terminal + Command) */}
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-2 h-full">
             <div className="flex-1 min-h-0">
                <TerminalLog 
                  messages={messages} 
                  clearLogs={() => setMessages([])} 
                />
             </div>
             <div className="h-[240px] shrink-0">
                <CommandCenter 
                  onSendMessage={handleSendMessage}
                  disabled={status !== ConnectionState.CONNECTED}
                />
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

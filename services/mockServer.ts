import { MessageType } from "../types";

// This simulates the behavior of your Java Netty Backend for demonstration purposes
// if a real connection cannot be established or for testing UI logic.
export class MockNettyServer {
  private listeners: ((msg: string) => void)[] = [];
  private intervalId: any;

  constructor() {
    console.log("[MockServer] Initialized. Ready to simulate Netty behavior.");
  }

  connect(onMessage: (msg: string) => void) {
    this.listeners.push(onMessage);
    
    // Simulate initial welcome
    setTimeout(() => {
      this.emit({ type: 'SYSTEM', content: 'Connected to Mock Netty Server v1.0' });
    }, 500);

    // Simulate random traffic
    this.intervalId = setInterval(() => {
      if (Math.random() > 0.7) {
        this.emit({ 
          type: 'BROADCAST', 
          content: `System Alert: High load on worker node #${Math.floor(Math.random() * 10)}`,
          sender: 'SERVER'
        });
      }
    }, 5000);
  }

  send(data: string) {
    try {
      const parsed = JSON.parse(data);
      
      // Handle Heartbeat
      if (parsed.type === 'PING') {
        setTimeout(() => {
          this.emit({ type: 'PONG', content: 'ack' });
        }, 100); // Simulate network latency
        return;
      }

      // Handle Auth
      if (parsed.type === 'AUTH') {
        setTimeout(() => {
          this.emit({ type: 'SYSTEM', content: `Authenticated as User-${parsed.content.substring(0, 5)}...` });
        }, 300);
        return;
      }

      // Echo message back (Simulating a chat room)
      if (parsed.type === 'MESSAGE' || parsed.type === 'BROADCAST') {
        setTimeout(() => {
          this.emit({ ...parsed, sender: 'ECHO_SERVICE' });
        }, 200);
      }

    } catch (e) {
      console.error("Mock server error parsing:", e);
    }
  }

  disconnect() {
    this.listeners = [];
    clearInterval(this.intervalId);
  }

  private emit(obj: any) {
    const str = JSON.stringify(obj);
    this.listeners.forEach(l => l(str));
  }
}
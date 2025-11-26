
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export enum MessageType {
  // System Types
  AUTH = 'AUTH',
  HEARTBEAT_PING = 'PING',
  HEARTBEAT_PONG = 'PONG',
  SYSTEM = 'SYSTEM',
  ERROR = 'ERROR',
  
  // User Data Types
  JSON = 'JSON',
  TEXT = 'TEXT',
  XML = 'XML',
  BINARY = 'BINARY'
}

export interface WSMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  sender?: string;
  isOutgoing: boolean;
}

export interface ConnectionConfig {
  url: string;
  token: string;
  enableHeartbeat: boolean;
  heartbeatInterval: number;
  heartbeatMessage: string;
}

export interface MetricPoint {
  time: string;
  inbound: number;
  outbound: number;
  latency: number;
}

export interface ProtocolSpecItem {
  id: string;
  label: string;
  color: string;
  format: string;
}

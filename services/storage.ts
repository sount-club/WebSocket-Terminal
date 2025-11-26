
export const STORAGE_KEYS = {
  CONFIG: 'netty_pulse_config',
  MACROS: 'netty_pulse_macros',
  PROTOCOL_SPEC: 'netty_pulse_spec',
  THEME: 'netty_pulse_theme',
  LANG: 'netty_pulse_lang'
};

export const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
};

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Failed to load from local storage', e);
    return fallback;
  }
};

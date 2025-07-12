// Store state temporarily (in production, use a proper store like Redis)
export const stateStore = new Map<string, { timestamp: number }>();

// Clean up old states every hour
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour
      stateStore.delete(state);
    }
  }
}, 3600000);
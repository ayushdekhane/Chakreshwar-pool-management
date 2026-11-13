type ConnectivityListener = (isOnline: boolean) => void;

class ConnectivityManager {
  private online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<ConnectivityListener> = new Set();
  private pingInterval: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleStatusChange(true));
      window.addEventListener('offline', () => this.handleStatusChange(false));

      // Periodic gentle heartbeat check when online
      this.startHeartbeat();
    }
  }

  public isOnline(): boolean {
    return this.online;
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    listener(this.online);
    return () => this.listeners.delete(listener);
  }

  public async checkRealConnection(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.handleStatusChange(false);
      return false;
    }

    try {
      // Lightweight HEAD ping with cache busting
      const response = await fetch(`/icons/pool-logo.svg?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      const isReachable = response.ok || response.type === 'opaque';
      this.handleStatusChange(isReachable);
      return isReachable;
    } catch {
      this.handleStatusChange(false);
      return false;
    }
  }

  private handleStatusChange(status: boolean) {
    if (this.online !== status) {
      this.online = status;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.online);
      } catch (err) {
        console.error('Error in connectivity listener:', err);
      }
    });
  }

  private startHeartbeat() {
    if (typeof window === 'undefined') return;
    // Check every 30 seconds
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkRealConnection();
      }
    }, 30000);
  }
}

export const connectivity = new ConnectivityManager();


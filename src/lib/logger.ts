/**
 * Sistema de logging para monitoramento e debugging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private logs: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      enableRemoteLogging: false,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.loadStoredLogs();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadStoredLogs(): void {
    if (!this.config.enableStorage) return;

    try {
      const stored = localStorage.getItem('app_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load stored logs:', error);
    }
  }

  private saveToStorage(): void {
    if (!this.config.enableStorage) return;

    try {
      // Manter apenas os logs mais recentes
      const recentLogs = this.logs.slice(-this.config.maxStorageEntries);
      localStorage.setItem('app_logs', JSON.stringify(recentLogs));
      this.logs = recentLogs;
    } catch (error) {
      console.warn('Failed to save logs to storage:', error);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemoteLogging || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.warn('Failed to send log to remote endpoint:', error);
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data);
    
    // Console logging
    if (this.config.enableConsole) {
      const logMethod = this.getConsoleMethod(level);
      if (data) {
        logMethod(`[${LogLevel[level]}] ${message}`, data);
      } else {
        logMethod(`[${LogLevel[level]}] ${message}`);
      }
    }

    // Storage
    this.logs.push(entry);
    this.saveToStorage();

    // Remote logging
    this.sendToRemote(entry);
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;

    this.log(LogLevel.ERROR, message, errorData);
  }

  // Métodos específicos para diferentes tipos de eventos
  userAction(action: string, data?: any): void {
    this.info(`User Action: ${action}`, data);
  }

  apiCall(method: string, url: string, status?: number, duration?: number): void {
    this.info(`API Call: ${method} ${url}`, { status, duration });
  }

  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance: ${metric}`, { value, unit });
  }

  // Métodos utilitários
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    if (this.config.enableStorage) {
      localStorage.removeItem('app_logs');
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  setUserId(userId: string): void {
    this.logs.forEach(log => {
      if (!log.userId) {
        log.userId = userId;
      }
    });
  }

  // Configuração dinâmica
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  enableRemoteLogging(endpoint: string): void {
    this.config.enableRemoteLogging = true;
    this.config.remoteEndpoint = endpoint;
  }

  disableRemoteLogging(): void {
    this.config.enableRemoteLogging = false;
  }
}

// Instância global do logger
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000,
  enableRemoteLogging: false
});

// Hook para usar o logger em componentes React
export function useLogger() {
  return logger;
}

// Decorator para logging automático de métodos
export function logMethod(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    logger.debug(`Method called: ${target.constructor.name}.${propertyName}`, { args });

    try {
      const result = method.apply(this, args);
      
      if (result instanceof Promise) {
        return result
          .then((res) => {
            const duration = performance.now() - start;
            logger.debug(`Method completed: ${target.constructor.name}.${propertyName}`, { duration });
            return res;
          })
          .catch((error) => {
            const duration = performance.now() - start;
            logger.error(`Method failed: ${target.constructor.name}.${propertyName}`, { error, duration });
            throw error;
          });
      } else {
        const duration = performance.now() - start;
        logger.debug(`Method completed: ${target.constructor.name}.${propertyName}`, { duration });
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`Method failed: ${target.constructor.name}.${propertyName}`, { error, duration });
      throw error;
    }
  };

  return descriptor;
}

// Utilitário para capturar erros não tratados
export function setupGlobalErrorHandling() {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason
    });
  });
}

// Métricas de performance
export function trackPageLoad() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        logger.performance('Page Load Time', navigation.loadEventEnd - navigation.fetchStart);
        logger.performance('DOM Content Loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        logger.performance('First Paint', navigation.responseEnd - navigation.fetchStart);
      }, 0);
    });
  }
}


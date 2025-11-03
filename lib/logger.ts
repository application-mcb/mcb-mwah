type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    return JSON.stringify(logEntry);
  }

  info(message: string, data?: any): void {
    if (!this.isProduction) {
      console.log(`[INFO] ${message}`, data || '');
    }
    // In production, you might want to send to a logging service
  }

  warn(message: string, data?: any): void {
    if (!this.isProduction) {
      console.warn(`[WARN] ${message}`, data || '');
    }
    // In production, you might want to send to a logging service
  }

  error(message: string, error?: any): void {
    if (!this.isProduction) {
      console.error(`[ERROR] ${message}`, error || '');
    }
    // In production, you might want to send to a logging service
  }

  debug(message: string, data?: any): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}

export const logger = new Logger();

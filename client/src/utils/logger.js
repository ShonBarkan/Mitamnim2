// src/utils/logger.js

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || true;

const COLORS = {
  info: '#00bcd4',   // Arctic Cyan
  warn: '#ff9800',   // Amber Alert
  error: '#f44336',  // Coral Red
  socket: '#9c27b0'  // Neon Purple
};

/**
 * Custom frontend logger utility for Mitamnim 2.
 * Formats console outputs with timestamps and domain tracing tags.
 */
class FrontendLogger {
  static _formatTime() {
    return new Date().toISOString().slice(11, 19);
  }

  static _log(level, tag, message, data = null) {
    if (!IS_DEVELOPMENT) return;

    const time = this._formatTime();
    const color = COLORS[level] || '#ffffff';
    const badgeStyle = `background: ${color}; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 3px;`;
    const textStyle = `color: ${color}; font-weight: 500;`;

    console.groupCollapsed(`%c[${time}] [${level.toUpperCase()}] [${tag}]%c ${message}`, badgeStyle, textStyle);
    if (data) {
      console.log('Payload/Context Context Matrix:', data);
    }
    console.groupEnd();
  }

  static info(tag, message, data = null) {
    this._log('info', tag, message, data);
  }

  static warn(tag, message, data = null) {
    this._log('warn', tag, message, data);
  }

  static error(tag, message, errorObj = null) {
    this._log('error', tag, message, errorObj);
  }

  static socket(message, data = null) {
    this._log('socket', 'WEBSOCKET', message, data);
  }
}

export default FrontendLogger;
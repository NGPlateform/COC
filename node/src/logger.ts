export type LogLevel = "debug" | "info" | "warn" | "error"

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

interface LogEntry {
  ts: string
  level: LogLevel
  component: string
  message: string
  data?: Record<string, unknown>
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
  child(component: string): Logger
}

let globalMinLevel: LogLevel = "info"

export function setLogLevel(level: LogLevel): void {
  globalMinLevel = level
}

export function getLogLevel(): LogLevel {
  return globalMinLevel
}

export function createLogger(component: string): Logger {
  function emit(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[globalMinLevel]) return

    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      component,
      message,
    }
    if (data !== undefined && Object.keys(data).length > 0) {
      entry.data = data
    }

    const line = JSON.stringify(entry)
    if (level === "error") {
      process.stderr.write(line + "\n")
    } else {
      process.stdout.write(line + "\n")
    }
  }

  return {
    debug(message, data) { emit("debug", message, data) },
    info(message, data) { emit("info", message, data) },
    warn(message, data) { emit("warn", message, data) },
    error(message, data) { emit("error", message, data) },
    child(childComponent) {
      return createLogger(`${component}.${childComponent}`)
    },
  }
}

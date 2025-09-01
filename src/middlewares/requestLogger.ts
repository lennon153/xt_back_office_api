import { Request, Response, NextFunction } from "express";

// ANSI color codes for terminal output
const Colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  
  // Text colors
  Red: "\x1b[31m",
  Green: "\x1b[32m",
  Yellow: "\x1b[33m",
  Blue: "\x1b[34m",
  Magenta: "\x1b[35m",
  Cyan: "\x1b[36m",
  White: "\x1b[37m",
  
  // Background colors
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
} as const;

// Helper function to get colorized status text
const getStatusInfo = (status: number): { color: string; text: string } => {
  if (status >= 500) return { color: Colors.Red, text: "ERROR" };
  if (status >= 400) return { color: Colors.Yellow, text: "WARN" };
  if (status >= 300) return { color: Colors.Cyan, text: "REDIRECT" };
  if (status >= 200) return { color: Colors.Green, text: "SUCCESS" };
  return { color: Colors.White, text: "INFO" };
};

// Helper function to get colorized HTTP method
const getMethodColor = (method: string): string => {
  const methodColors: { [key: string]: string } = {
    GET: Colors.Green,
    POST: Colors.Blue,
    PUT: Colors.Yellow,
    DELETE: Colors.Red,
    PATCH: Colors.Magenta,
    OPTIONS: Colors.Cyan,
    HEAD: Colors.White,
  };
  return methodColors[method] || Colors.White;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  res.on("finish", () => {
    const status = res.statusCode;
    const duration = Date.now() - startTime;
    
    const { color: statusColor, text: statusText } = getStatusInfo(status);
    const methodColor = getMethodColor(req.method);
    
    // Get content length if available
    const contentLength = res.getHeader('content-length') || '0';
    
    // Format the log message with colors
    const timestamp = new Date().toISOString();
    
    console.log(
      `${Colors.Dim}[${timestamp}]${Colors.Reset} ` +
      `${methodColor}${req.method.padEnd(7)}${Colors.Reset} ` +
      `${Colors.White}${req.originalUrl}${Colors.Reset} - ` +
      `IP: ${Colors.Cyan}${ip}${Colors.Reset} - ` +
      `${statusColor}${status} ${statusText.padEnd(8)}${Colors.Reset} - ` +
      `Duration: ${Colors.Magenta}${duration}ms${Colors.Reset} - ` +
      `Size: ${Colors.Blue}${contentLength}b${Colors.Reset}`
    );
  });

  next();
};
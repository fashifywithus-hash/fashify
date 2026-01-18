/**
 * Request Logging Middleware
 * Logs all API requests with method, path, and payload
 */

import { Request, Response, NextFunction } from "express";

export interface LoggedRequest extends Request {
  startTime?: number;
}

/**
 * Middleware to log API requests and payloads
 */
export const requestLogger = (
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Store start time for response time calculation
  req.startTime = Date.now();

  // Get timestamp
  const timestamp = new Date().toISOString();

  // Extract request information
  const method = req.method;
  const path = req.path;
  const fullUrl = req.originalUrl || req.url;
  const queryParams = Object.keys(req.query).length > 0 ? req.query : undefined;
  const routeParams = Object.keys(req.params).length > 0 ? req.params : undefined;
  
  // Get request body (be careful with large payloads)
  let body = req.body;
  
  // Truncate large base64 strings in logs for readability
  if (body && typeof body === "object") {
    body = JSON.parse(JSON.stringify(body));
    if (body.photo_url && typeof body.photo_url === "string" && body.photo_url.length > 100) {
      body.photo_url = `[base64 data, ${body.photo_url.length} chars]`;
    }
  }

  // Build log object
  const logData: any = {
    timestamp,
    method,
    path: fullUrl,
  };

  // Add query params if present
  if (queryParams) {
    logData.query = queryParams;
  }

  // Add route params if present
  if (routeParams) {
    logData.params = routeParams;
  }

  // Always add body/payload to log (even if empty)
  // This helps track when empty payloads are sent
  if (body !== undefined && body !== null) {
    // Check if it's an empty object (not array, not null)
    if (typeof body === "object" && !Array.isArray(body) && Object.keys(body).length === 0) {
      logData.payload = {}; // Empty object (will display as {} in JSON)
    } else {
      logData.payload = body; // Show actual payload
    }
  } else if (body === null) {
    logData.payload = null; // Explicitly null
  } else {
    // body is undefined - still log it to show no payload was sent
    logData.payload = "(empty)"; // Show that no body was sent
  }

  // Log the request
  console.log("📥 API Request:", JSON.stringify(logData, null, 2));

  // Log response when it finishes
  const originalSend = res.send;
  res.send = function (data) {
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    const statusCode = res.statusCode;
    
    console.log(`📤 API Response: ${method} ${fullUrl} - ${statusCode} (${responseTime}ms)`);
    
    return originalSend.call(this, data);
  };

  next();
};

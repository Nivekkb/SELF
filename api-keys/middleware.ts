import { Request, Response, NextFunction } from 'express';
import { validateRequest } from './keyService';

export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract API key from headers or query parameters
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'MISSING_API_KEY'
      });
    }

    // Get environment from headers or default to development
    const environment = req.headers['x-environment'] as string || process.env.NODE_ENV || 'development';

    // Validate the API key
    const validation = await validateRequest(apiKey as string, environment);

    if (!validation.valid) {
      return res.status(403).json({
        error: 'Invalid API key',
        reason: validation.reason,
        code: 'INVALID_API_KEY'
      });
    }

    // Attach key information to the request
    (req as any).apiKey = validation.key;
    (req as any).licenseeId = validation.key?.licenseeId;

    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      error: 'Internal server error during API key validation',
      code: 'SERVER_ERROR'
    });
  }
}

export function requireApiKey() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(req as any).apiKey) {
        return res.status(401).json({
          error: 'API key required',
          code: 'MISSING_API_KEY'
        });
      }
      next();
    } catch (error) {
      console.error('API key requirement check error:', error);
      res.status(500).json({
        error: 'Internal server error during API key requirement check',
        code: 'SERVER_ERROR'
      });
    }
  };
}

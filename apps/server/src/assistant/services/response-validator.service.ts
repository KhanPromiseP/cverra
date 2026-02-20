// services/response-validator.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ResponseValidatorService {
  private readonly logger = new Logger(ResponseValidatorService.name);

  validateAndClean(response: string): any {
    try {
      // Try direct parse first
      return JSON.parse(response);
    } catch (e) {
      // Try to extract JSON from markdown
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {}
      }
      
      // Try to find JSON object in text
      const objectMatch = response.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {}
      }
      
      // If all else fails, return the raw response with a flag
      this.logger.debug('Could not parse JSON, returning raw text');
      return {
        content: response,
        format: 'text',
        warning: 'Response formatting issue'
      };
    }
  }

  sanitizeForJson(text: string): string {
    // Remove control characters
    let sanitized = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // Fix common JSON issues
    sanitized = sanitized
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes
      .replace(/\\(?!["\\/bfnrt])/g, '\\\\'); // Fix backslashes
    
    return sanitized;
  }

  extractJsonFromText(text: string): string | null {
    // Try to find JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];
    
    // Try to find JSON object
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) return objectMatch[0];
    
    return null;
  }
}
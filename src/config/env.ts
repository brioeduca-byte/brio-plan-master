/**
 * Environment configuration for the application
 * Uses Vite's import.meta.env for environment variables
 */

export const env = {
  // API Configuration
  // In development, Vite proxy handles /api requests
  // In production, use the full API URL
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://brio-site.vercel.app',
  
  // Development flag
  IS_DEV: import.meta.env.DEV,
} as const;

/**
 * Type-safe environment variable access
 */
export type Env = typeof env;
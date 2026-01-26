/**
 * Logger utility for consistent error handling.
 * In development, logs to console.
 * In production, can be extended to send to Sentry/Bugsnag.
 */

import * as Sentry from '@sentry/react-native';

const isDev = __DEV__;

export const logger = {
    /**
     * Log an error with optional context
     */
    error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
        if (isDev) {
            console.error(`[ERROR] ${message}`, error, context);
        }
        Sentry.captureException(error instanceof Error ? error : new Error(message), {
            extra: { message, ...context },
        });
    },

    /**
     * Log a warning
     */
    warn: (message: string, context?: Record<string, unknown>) => {
        if (isDev) {
            console.warn(`[WARN] ${message}`, context);
        }
        Sentry.captureMessage(message, {
            level: 'warning',
            extra: context,
        });
    },

    /**
     * Log info (dev only)
     */
    info: (message: string, context?: Record<string, unknown>) => {
        if (isDev) {
            console.log(`[INFO] ${message}`, context);
        }
        // Info logs are optionally sent to Sentry as breadcrumbs usually, 
        // avoiding spamming captureMessage here.
        Sentry.addBreadcrumb({
            message,
            level: 'info',
            data: context,
        });
    },
};

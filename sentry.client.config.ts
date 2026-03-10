import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Replay is only available in the client
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Capture 10% of all transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Capture Replay for 10% of all sessions
  // with 100% capture for errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
});

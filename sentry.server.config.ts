import * as Sentry from "@sentry/nextjs";

// Only initialize if DSN is configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}

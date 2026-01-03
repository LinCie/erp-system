import * as Sentry from "@sentry/node";

const dsn = Deno.env.get("SENTRY_DSN");
if (!dsn) throw new Error("SENTRY_DSN is not defined");

Sentry.init({
  dsn,
  sendDefaultPii: true,
});

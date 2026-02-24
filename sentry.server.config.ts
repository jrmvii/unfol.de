// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
  beforeSend(event) {
    // Strip PII: remove cookies from error reports
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.["cookie"];
    }
    return event;
  },
});

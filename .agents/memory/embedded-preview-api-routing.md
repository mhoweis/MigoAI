---
name: Embedded preview API routing
description: Why the Expo web preview should proxy API calls through its own origin on Replit.
---

Route browser API calls through the web server's origin and proxy them internally to the backend instead of sending the browser directly to a forwarded secondary port.

**Why:** The secondary backend port was healthy by direct HTTP checks and had valid CORS and cross-origin resource headers, but requests from the embedded Replit browser still failed before reaching the backend.

**How to apply:** For Replit web previews with a separate local backend process, expose `/api` through the primary web workflow and keep direct host/port URLs for native clients only.
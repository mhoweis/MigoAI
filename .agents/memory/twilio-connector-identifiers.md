---
name: Twilio connector identifiers
description: Covers required non-secret identifiers when a restricted Twilio connector cannot enumerate account resources.
---

The Twilio connector may authenticate with an API key that is permitted to send messages but receives a permissions error when listing accounts. Do not depend on account or incoming-number discovery at runtime.

**Why:** Twilio's Messages API path still requires an Account SID, and sending requires an SMS-capable sender number even though authentication is handled by the connector.

**How to apply:** Keep authentication in the connector. Request the Account SID and sender number as non-secret environment variables, then use them to construct the Messages API request.
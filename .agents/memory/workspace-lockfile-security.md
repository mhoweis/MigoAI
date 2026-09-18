---
name: Workspace lockfile security updates
description: How to handle security-blocked transitive packages in imported npm workspace lockfiles.
---

When a security policy blocks a transitive npm package, add a root override to a safe compatible release. If npm still requests the blocked release, check for a stale workspace-nested entry in the imported lockfile and remove only that package entry so npm can resolve and record the override.

**Why:** Imported workspace lockfiles can preserve nested resolved versions even after a root override is added, causing repeated downloads of the blocked tarball.

**How to apply:** Identify the direct parent and compatibility range first. Prefer upgrading the parent; use a targeted override and targeted stale-entry removal only when the parent already accepts the safe release.
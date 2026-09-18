---
name: Metro watch roots on Replit
description: Stable Metro watch-folder configuration for the Expo monorepo in Replit.
---

Do not configure Metro to watch the entire Replit workspace. Limit external watch roots to stable directories required by the app, including the root dependency directory and shared workspace packages.

**Why:** Replit rotates temporary directories under `.local`; Metro's fallback watcher crashes with `ENOENT` if one disappears. Excluding the root dependency directory entirely also prevents Metro from resolving hoisted packages such as `react-native-web`.

**How to apply:** Keep the mobile project as Metro's project root, and explicitly include only hoisted dependencies and shared source directories in `watchFolders`.
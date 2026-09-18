const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only shared source used by the mobile app. Watching the whole Replit
// workspace includes temporary .local directories that can disappear and
// crash Metro's file watcher.
config.watchFolders = [
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'packages/shared'),
];

// Tell Metro where to look for node_modules — mobile-local first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Keep browser API calls on the same origin as Expo web. Replit's forwarded
// secondary ports are not consistently reachable from embedded previews.
config.server.enhanceMiddleware = (metroMiddleware) => {
  return (req, res, next) => {
    if (!req.url?.startsWith('/api')) {
      return metroMiddleware(req, res, next);
    }

    const backendPort = Number(process.env.MIGO_BACKEND_PORT || 5001);
    const proxyRequest = http.request(
      {
        hostname: '127.0.0.1',
        port: backendPort,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `127.0.0.1:${backendPort}`,
        },
      },
      (proxyResponse) => {
        res.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
        proxyResponse.pipe(res);
      }
    );

    proxyRequest.on('error', (error) => {
      console.error('[API Proxy Error]', error.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ success: false, error: 'Backend is unavailable' }));
    });

    req.pipe(proxyRequest);
  };
};

module.exports = config;

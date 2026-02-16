// /// <reference types='vitest' />

// import { lingui } from "@lingui/vite-plugin";
// import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
// import react from "@vitejs/plugin-react";
// import { defineConfig, searchForWorkspaceRoot } from "vite";

// export default defineConfig({
//   cacheDir: "../../node_modules/.vite/client",
  

//   build: {
//     sourcemap: true,
//     emptyOutDir: true,
//   },

//   define: {
//     appVersion: JSON.stringify(process.env.npm_package_version),
//   },

//   server: {
//     host: true,
//     port: 5173,
//     fs: { allow: [searchForWorkspaceRoot(process.cwd())] },
//   },

//   optimizeDeps: {
//     esbuildOptions: {
//       loader: {
//         ".po": "text",
//       },
//     },
//   },

//   plugins: [
//     react({
//       babel: {
//         plugins: ["macros"],
//       },
//     }),
//     lingui(),
//     nxViteTsPaths(),
//   ],

//   test: {
//     globals: true,
//     environment: "jsdom",
//     include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
//   },

//   resolve: {
//     alias: {
//       "@/client/": `${searchForWorkspaceRoot(process.cwd())}/apps/client/src/`,
//     },
//   },
// });

/// <reference types='vitest' />

import { lingui } from "@lingui/vite-plugin";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, searchForWorkspaceRoot } from "vite";

export default defineConfig({
  cacheDir: "../../node_modules/.vite/client",
  
  build: {
    sourcemap: true,
    emptyOutDir: true,
  },

  define: {
    appVersion: JSON.stringify(process.env.npm_package_version),
  },

  server: {
  host: true,
  port: 5173,
  fs: { allow: [searchForWorkspaceRoot(process.cwd())] },
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq, req, res) => {
          console.log(`[Vite Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
        });
        proxy.on('proxyRes', (proxyRes, req, res) => {
          console.log(`[Vite Proxy] Response from ${req.url}: ${proxyRes.statusCode}`);
          // Log cookies being set
          const setCookie = proxyRes.headers['set-cookie'];
          if (setCookie) {
            console.log('[Vite Proxy] Set-Cookie:', setCookie);
          }
        });
      },
    },
  },
},

  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".po": "text",
      },
    },
  },

  plugins: [
    react({
      babel: {
        plugins: ["macros"],
      },
    }),
    lingui(),
    nxViteTsPaths(),
  ],

  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },

  resolve: {
    alias: {
      "@/client/": `${searchForWorkspaceRoot(process.cwd())}/apps/client/src/`,
    },
  },
});

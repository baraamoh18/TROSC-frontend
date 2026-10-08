import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev proxy target for /v1/* requests. Defaults to a local backend so that
// `npm run dev` never reads or writes production data. To point the dev
// server at the deployed API on purpose, run `npm run dev:prod-api`
// (loads .env.prod-api) or set DEV_API_TARGET in a .env.local file.
const DEFAULT_DEV_API_TARGET = "http://localhost:5000";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devApiTarget = env.DEV_API_TARGET || DEFAULT_DEV_API_TARGET;
  // Optional Origin to present to the API. Its CORS check rejects
  // http://localhost, which blocks sign-in and other writes in dev.
  const devApiOrigin = env.DEV_API_ORIGIN;

  return {
    plugins: [react(), tailwindcss()],
    base: "/",
    server: {
      proxy: {
        "/v1": {
          target: devApiTarget,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: "localhost",
          configure: (proxy) => {
            if (!devApiOrigin) return;
            proxy.on("proxyReq", (proxyReq) => {
              if (proxyReq.getHeader("origin")) proxyReq.setHeader("origin", devApiOrigin);
            });
          },
        },
      },
    },
  };
});

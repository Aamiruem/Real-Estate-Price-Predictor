import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.API_PROXY_TARGET || "http://127.0.0.1:8001";
  const ragTarget = env.RAG_PROXY_TARGET || "http://127.0.0.1:8002";

  return {
    plugins: [tailwindcss()],
    // In development the browser calls /api and /ai on the Vite origin, so
    // auth cookies are first-party and no CORS preflight is needed.
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/ai": {
          target: ragTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai/, ""),
        },
      },
    },
  };
};

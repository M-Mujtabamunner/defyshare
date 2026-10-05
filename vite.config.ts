import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { b2Config, handleSignRequest } from "./server/b2.js";

// Serves /api/b2-sign during `npm run dev` (on Vercel it is api/b2-sign.js).
// Credentials come from .env.local (B2_KEY_ID, B2_APPLICATION_KEY, ...).
const b2DevApi = (env: Record<string, string>): Plugin => ({
  name: "b2-dev-api",
  configureServer(server) {
    server.middlewares.use("/api/b2-sign", (req, res) => {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", async () => {
        try {
          const { status, json } = await handleSignRequest(JSON.parse(raw || "{}"), b2Config(env));
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(json));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Bind to localhost only — set HOST=0.0.0.0 (or "::") to expose globally
    host: process.env.HOST ?? "127.0.0.1",
    port: Number(process.env.PORT ?? 8080),
    strictPort: true,
  },
  plugins: [
    react(),
    b2DevApi(loadEnv(mode, process.cwd(), "")),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
}));

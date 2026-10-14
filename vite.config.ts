import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { Connect, Plugin, ViteDevServer } from "vite";
import { defineConfig } from "vitest/config";
import { delayMs, shouldFail } from "./src/apiTiming";

const root = path.dirname(fileURLToPath(import.meta.url));
const borrowersFile = path.join(root, "borrowers.json");

function sendBorrowers(_request: Connect.IncomingMessage, response: Connect.ServerResponse) {
  const delay = delayMs(Math.random());
  setTimeout(() => {
    if (shouldFail(Math.random())) {
      response.statusCode = 503;
      response.setHeader("content-type", "application/json");
      response.setHeader("cache-control", "no-store");
      response.end(JSON.stringify({ error: "unavailable" }));
      return;
    }
    response.statusCode = 200;
    response.setHeader("content-type", "application/json");
    response.setHeader("cache-control", "no-store");
    response.end(fs.readFileSync(borrowersFile));
  }, delay);
}

function borrowersApiPlugin(): Plugin {
  const attach = (server: ViteDevServer) => {
    server.middlewares.use((request, response, next) => {
      const pathname = request.url?.split("?")[0];
      if (pathname !== "/api/borrowers") {
        next();
        return;
      }
      if (request.method !== "GET") {
        response.statusCode = 405;
        response.end();
        return;
      }
      sendBorrowers(request, response);
    });
  };

  return {
    name: "borrowers-api",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig({
  plugins: [react(), borrowersApiPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});

import http from "http";
import fs from "fs";
import path from "path";
import { getSiteDirForDomain } from "./domainRegistry";

let server: http.Server | null = null;
let serverPort = 0;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
};

export function startSiteServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    if (server) {
      resolve(serverPort);
      return;
    }
    server = http.createServer((req, res) => {
      const host = req.headers.host?.split(":")[0] ?? "";
      const siteDir = getSiteDirForDomain(host);
      if (!siteDir || !fs.existsSync(siteDir)) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html><html><body><h1>404 - Domain not found</h1><p>The domain <strong>${host}</strong> is not registered in Consia Browser.</p></body></html>`);
        return;
      }
      let reqPath = req.url?.split("?")[0] ?? "/";
      if (reqPath === "/" || reqPath === "") reqPath = "/index.html";
      const filePath = path.join(siteDir, reqPath);
      if (!filePath.startsWith(siteDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      if (!fs.existsSync(filePath)) {
        const fallback = path.join(siteDir, "index.html");
        if (fs.existsSync(fallback)) {
          const content = fs.readFileSync(fallback);
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(content);
        } else {
          res.writeHead(404);
          res.end("Not found");
        }
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] ?? "application/octet-stream";
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": mime });
      res.end(content);
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server!.address();
      serverPort = typeof addr === "object" && addr ? addr.port : 0;
      resolve(serverPort);
    });
    server.on("error", reject);
  });
}

export function stopSiteServer() {
  if (server) {
    server.close();
    server = null;
    serverPort = 0;
  }
}

export function getServerPort(): number {
  return serverPort;
}

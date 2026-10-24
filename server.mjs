import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { currentUtahDrought } from "./drought-data.mjs";

const root = process.cwd();
const port = Number(process.env.PORT || 5178);
const host = process.env.HOST || "127.0.0.1";
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const publicFiles = new Set(["/index.html", "/styles.css", "/app.js", "/preview.html", "/flow-lines.svg", "/county-map.json", "/showcase-county-stats.json", "/config.js", "/data-core.js", "/cloud.js", "/features.js", "/environment-snapshot.json", "/app.webmanifest", "/sw.js", "/icons/icon.svg", "/icons/icon-180.png", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png"]);

http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname === "/api/drought") {
      try {
        const value = await currentUtahDrought();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=1800" });
        res.end(JSON.stringify(value));
      } catch {
        res.writeHead(503, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        res.end(JSON.stringify({ error: "Official drought data unavailable" }));
      }
      return;
    }
    if (pathname === "/__version") {
      const files = [...publicFiles].map(name => name.slice(1));
      const versions = await Promise.all(files.map(async (name) => (await stat(path.join(root, name))).mtimeMs));
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end(String(Math.max(...versions)));
      return;
    }
    const publicPath = pathname === "/" ? "/index.html" : pathname;
    if (!publicFiles.has(publicPath)) {
      res.writeHead(404).end("Not found");
      return;
    }
    const file = path.resolve(root, "." + publicPath);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, host, () => {
  process.stdout.write("Ripples demo: http://" + host + ":" + port + "/\n");
});

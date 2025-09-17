import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import path from "path";
import fs from "fs/promises";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Development: Use Vite middleware to serve the React SPA
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve(process.cwd(), "client")
    });

    // Use Vite's middleware to serve frontend files
    app.use(vite.middlewares);

    // SPA catchall route - serve index.html for client-side routing
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }

      try {
        const url = req.originalUrl;
        let template = await fs.readFile(
          path.resolve(process.cwd(), "client/index.html"),
          "utf-8"
        );
        
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        if (e instanceof Error) {
          vite.ssrFixStacktrace(e);
          console.log(e.stack);
          res.status(500).end(e.message);
        }
      }
    });

    log("Vite development server middleware configured");
  } else {
    // Production: Serve static files from dist/public
    const distPath = path.resolve(process.cwd(), "dist/public");
    app.use(express.static(distPath));
    
    // SPA catchall route for production
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      res.sendFile(path.resolve(distPath, "index.html"));
    });
    
    log("Static files served from dist/public");
  }

  // ALWAYS serve the app on port 5000 for Replit compatibility
  // Replit expects the application to be accessible on port 5000
  // Override any PORT environment variable to ensure proper functionality
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on http://0.0.0.0:${port}`);
  });

})();

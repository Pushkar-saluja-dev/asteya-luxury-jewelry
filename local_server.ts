import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import app from "./server";

const PORT = Number(process.env.PORT || 3000);

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("ASTEYA Gateway: Vite dev-middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("ASTEYA Gateway: Static client files mounted from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(`👑 ASTEYA Haute Atelier Engine Live on Port ${PORT} 👑`);
    console.log(`===============================================`);
  });
}

bootstrap().catch((err) => {
  console.error("Critical: ASTEYA Atelier Engine failed to ignite:", err);
});

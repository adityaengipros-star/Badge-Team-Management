import Fastify from "fastify";
import cors from "@fastify/cors";
import compress from "@fastify/compress";
import cookie from "@fastify/cookie";
import { seed } from "./seed";
import { SESSION_COOKIE, cleanupExpiredSessions, getSessionUser } from "./auth";
import { authRoutes } from "./routes/auth";
import { taskRoutes } from "./routes/tasks";
import { projectRoutes } from "./routes/projects";
import { chatRoutes } from "./routes/chat";
import { miscRoutes } from "./routes/misc";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

// Endpoints reachable without a session.
const PUBLIC = new Set(["/api/health"]);
const isPublic = (url: string) => PUBLIC.has(url) || url.startsWith("/api/auth/");

async function main() {
  seed();
  cleanupExpiredSessions();

  const app = Fastify({ logger: true });

  await app.register(compress, { global: true, threshold: 512 });
  await app.register(cookie);

  // CORS: explicit origins in prod (with credentials), permissive in dev.
  const origins = (process.env.CORS_ORIGIN ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  await app.register(cors, { origin: origins.length ? origins : true, credentials: true });

  // Populate request.user from the session cookie, and gate protected routes.
  app.addHook("onRequest", async (req, reply) => {
    const token = req.cookies?.[SESSION_COOKIE];
    req.user = getSessionUser(token);
    const url = (req.raw.url ?? "").split("?")[0];
    if (url.startsWith("/api/") && !isPublic(url) && !req.user) {
      return reply.code(401).send({ error: "authentication required" });
    }
  });

  await app.register(authRoutes);
  await app.register(taskRoutes);
  await app.register(projectRoutes);
  await app.register(chatRoutes);
  await app.register(miscRoutes);

  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

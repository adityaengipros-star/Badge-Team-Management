import { FastifyInstance } from "fastify";
import { db } from "../db";
import {
  addMessage,
  channelMessages,
  channelsForUser,
  getOrCreateDm,
  isChannelMember,
} from "../repo";

export async function chatRoutes(app: FastifyInstance) {
  // GET /api/channels — public channels + this user's DMs
  app.get("/api/channels", (req) => channelsForUser(req.user!.id));

  // GET /api/channels/:id/messages?after=<iso>
  app.get("/api/channels/:id/messages", (req, reply) => {
    const { id } = req.params as { id: string };
    const { after } = req.query as { after?: string };
    if (!db.prepare("SELECT 1 FROM channels WHERE id = ?").get(id)) {
      return reply.code(404).send({ error: "channel not found" });
    }
    if (!isChannelMember(id, req.user!.id)) {
      return reply.code(403).send({ error: "not a member of this conversation" });
    }
    return channelMessages(id, after);
  });

  // POST /api/channels/:id/messages
  app.post("/api/channels/:id/messages", (req, reply) => {
    const { id } = req.params as { id: string };
    if (!db.prepare("SELECT 1 FROM channels WHERE id = ?").get(id)) {
      return reply.code(404).send({ error: "channel not found" });
    }
    if (!isChannelMember(id, req.user!.id)) {
      return reply.code(403).send({ error: "not a member of this conversation" });
    }
    const body = ((req.body as any)?.text ?? "").trim();
    if (!body) return reply.code(400).send({ error: "message text is required" });
    return reply.code(201).send(addMessage(id, req.user!.id, body));
  });

  // POST /api/dms/:userId — open (or create) a DM with another user
  app.post("/api/dms/:userId", (req, reply) => {
    const { userId } = req.params as { userId: string };
    if (userId === req.user!.id) return reply.code(400).send({ error: "cannot DM yourself" });
    if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(userId)) {
      return reply.code(404).send({ error: "user not found" });
    }
    const channelId = getOrCreateDm(req.user!.id, userId);
    return { id: channelId };
  });
}

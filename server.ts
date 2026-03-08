/**
 * Custom Next.js server with Socket.IO.
 * Run with: tsx server.ts (dev) or node server.js (prod after tsc)
 */
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // ── Socket.IO ────────────────────────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      credentials: true,
    },
    path: "/api/socket",
  });

  // Make io globally accessible from API routes / server actions
  (global as unknown as { io: SocketIOServer }).io = io;

  io.on("connection", (socket) => {
    // ── Room management ──────────────────────────────────────────────────
    socket.on("room:join", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on("room:leave", (roomId: string) => {
      socket.leave(roomId);
    });

    // ── Channel messages ─────────────────────────────────────────────────
    // (Client sends optimistic data; server broadcasts confirmed payload
    //  after POST /api/messages saves to DB and emits here)

    // ── Typing indicators ────────────────────────────────────────────────
    socket.on(
      "typing:start",
      (data: { roomId: string; userName: string }) => {
        socket.to(data.roomId).emit("typing:start", data);
      }
    );

    socket.on("typing:stop", (data: { roomId: string; userId: string }) => {
      socket.to(data.roomId).emit("typing:stop", data);
    });

    socket.on("disconnect", () => {
      // cleanup handled automatically by socket.io
    });
  });

  // ── Start ────────────────────────────────────────────────────────────────
  httpServer.listen(port, () => {
    console.log(
      `\n🏠 House Ledger Software ready on http://${hostname}:${port}\n`
    );
  });
});

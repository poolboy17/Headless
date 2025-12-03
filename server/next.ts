import next from "next";
import { type Express } from "express";
import { type Server } from "http";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "5000", 10);

export async function setupNext(server: Server, app: Express) {
  const nextApp = next({ dev, hostname, port });
  const handle = nextApp.getRequestHandler();
  
  await nextApp.prepare();
  
  app.all("*", (req, res) => {
    return handle(req, res);
  });
}

import type { Express } from "express";
import app from "@/app.js";

export function getTestApp(): Express {
  return app;
}

import express from "express";
import morgan from "morgan";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import { securityConfig } from "@/config/security.config.js";
import { bodyParserErrorMiddleware } from "@/middlewares/bodyParserError.middleware.js";
import { errorHandler } from "@/middlewares/errorHandler.js";
import { globalApiRateLimiter } from "@/middlewares/rate-limit/rate-limit.middleware.js";
import { businessesAppRoutes, platformRoutes } from "@/modules/index.js";

dotenv.config({ quiet: true });

const app = express();

if (securityConfig.trustProxyHops > 0) {
  app.set("trust proxy", securityConfig.trustProxyHops);
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (securityConfig.frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("ORIGIN_NOT_ALLOWED"));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  methods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(helmet());
app.use(cors(corsOptions));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(cookieParser());
app.use(express.json({ limit: securityConfig.jsonBodyLimit }));
app.use(
  express.urlencoded({
    extended: false,
    limit: securityConfig.urlEncodedBodyLimit,
  }),
);
app.use(bodyParserErrorMiddleware);

app.get("/", (_req, res) => res.send("Api funcionando"));

app.use("/api", globalApiRateLimiter);

if (process.env.NODE_ENV === "test") {
  app.get("/api/__test__/internal-error", () => {
    throw new Error("Table users does not exist in procedure sp_secret");
  });
}

app.use("/api", platformRoutes);
app.use("/api", businessesAppRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    status: "ERROR",
    code: "ROUTE_NOT_FOUND",
    message: "La ruta solicitada no existe.",
    data: null,
  });
});

app.use(errorHandler);

export default app;

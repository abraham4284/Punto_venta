import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { errorHandler } from "@/middlewares/errorHandler.js";
import { businessesAppRoutes, platformRoutes } from "@/modules/index.js";

dotenv.config();

const app = express();

const allowList = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_LOCAL,
].filter(Boolean); // saca los undefined

const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Permite requests sin Origin (como Postman)
    if (!origin) return callback(null, true);

    // Si el origin está en la allowList, lo permitimos
    if (allowList.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

app.get("/", (_, res) => {
  res.send("Api funcionando");
});
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

app.get("/", (_, res) => res.send("Api funcionando"));

app.use("/api", platformRoutes);
app.use("/api", businessesAppRoutes);

app.use(errorHandler);

export default app;

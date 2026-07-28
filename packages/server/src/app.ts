import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { swaggerOptions } from "./swagger";
import { locale } from "./middleware/locale";

export const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(locale);

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

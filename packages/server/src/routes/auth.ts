import { Router } from "express";
import { signup, login, logout, refresh, me, checkEmail } from "../controllers/auth";
import { requireAuth } from "../middleware/requireAuth";

export const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refresh);
authRouter.get("/me", requireAuth, me);
authRouter.get("/check-email", checkEmail);

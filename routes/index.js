import {Router} from "express";
import {router as userRouter} from "./user.js";

export const router = new Router();

router.use("/auth", userRouter);

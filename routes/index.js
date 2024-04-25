import {Router} from "express";
import {router as userRouter} from "./user.js";
import {router as sessionRouter} from "./sessions.js";
import {router as cardRouter} from "./cards.js";
import {router as participantRouter} from "./participants.js";
import {router as messageRouter} from "./messages.js";
import {router as commentRouter} from "./comments.js";

export const router = new Router();

router.use("/auth", userRouter);
router.use("/sessions", sessionRouter);
router.use("/cards", cardRouter);
router.use("/participants", participantRouter);
router.use("/comments", commentRouter);
router.use("/messages", messageRouter);

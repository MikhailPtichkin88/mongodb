import {Router} from "express";
import {MessageController} from "../controllers/index.js";
import {checkAuth} from "../utils/index.js";

export const router = new Router();

router.get("/toSanta", checkAuth, MessageController.getMessagesToSanta);
router.post("/toSanta", checkAuth, MessageController.sendMessageToSanta);

router.get("/fromSanta", checkAuth, MessageController.getMessagesFromSanta);
router.post("/fromSanta", checkAuth, MessageController.sendMessageFromSanta);
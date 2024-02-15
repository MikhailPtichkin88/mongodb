import {Router} from "express";
import {ParticipantController} from "../controllers/index.js";
import {checkAuth} from "../utils/index.js";

export const router = new Router();

router.get("/", checkAuth, ParticipantController.getAll);

router.post("/", checkAuth, ParticipantController.create);

router.delete("/", checkAuth, ParticipantController.remove);

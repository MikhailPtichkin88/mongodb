import {Router} from "express";
import {CommentController} from "../controllers/index.js";
import {checkAuth} from "../utils/index.js";

export const router = new Router();

router.get("/", checkAuth, CommentController.getAll);

router.post("/", checkAuth, CommentController.create);

router.patch("/", checkAuth, CommentController.edit);

router.delete("/", checkAuth, CommentController.remove);

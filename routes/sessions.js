import {Router} from "express";
import {SessionController} from "../controllers/index.js";
import {
  handleValidationErrors,
  checkAuth,
  savePicture,
  deletePicture,
} from "../utils/index.js";
import {titleAndDescrValidation} from "../validations.js";
import multer from "multer";
import fs from "fs";

export const router = new Router();

router.get("/", checkAuth, SessionController.getAll);

router.get("/:sessionId", checkAuth, SessionController.getOne);
router.get("/:sessionId/chooseCards", checkAuth, SessionController.chooseCards);

router.post(
  "/",
  checkAuth,
  titleAndDescrValidation,
  handleValidationErrors,
  SessionController.create
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const directory = `uploads/sessions`;
    if (!fs.existsSync(directory)) {
      // Создание директории
      fs.mkdirSync(directory);
      console.log("Директория успешно создана.");
    }
    cb(null, "uploads/sessions");
  },
  // savePicture - сохраняем саму картинку и записываем ее имя в req.pictureName
  filename: function (req, file, cb) {
    savePicture(req, file, cb, "session");
  },
});

const upload = multer({
  storage,
  limits: {fileSize: 1000000},
});

router.patch(
  "/:sessionId",
  checkAuth,
  upload.single("session_img"),
  titleAndDescrValidation,
  handleValidationErrors,
  SessionController.update
);

router.delete("/:sessionId", checkAuth, SessionController.remove);
router.delete(
  "/:sessionId/img",
  checkAuth,
  deletePicture("session"),
  SessionController.deleteImg
);

import {Router} from "express";
import {CardController} from "../controllers/index.js";
import {
  handleValidationErrors,
  checkAuth,
  savePicture,
} from "../utils/index.js";
import {
  titleAndDescrValidation,
  // bindUserValidation,
  selectCardValidation,
} from "../validations.js";
import multer from "multer";
import fs from "fs";

export const router = new Router();

router.get("/", checkAuth, CardController.getAll);

router.get(
  "/chooseCard",
  checkAuth,
  selectCardValidation,
  CardController.chooseCard
);

router.post("/", checkAuth, CardController.create);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const sessionId = req.query.sessionId;
    const directory = `uploads/cards/${sessionId}`;
    if (!fs.existsSync(directory)) {
      // Создание директории
      fs.mkdirSync(directory, {recursive: true});
      console.log("Директория успешно создана.");
    }

    cb(null, directory);
  },
  // savePicture - сохраняем саму картинку и записываем ее имя в req.pictureName
  filename: function (req, file, cb) {
    savePicture(req, file, cb, "card");
  },
});

const upload = multer({
  storage,
  limits: {fileSize: 1000000},
});

router.patch(
  "/:cardId",
  checkAuth,
  upload.single("card_img"),
  titleAndDescrValidation,
  handleValidationErrors,
  CardController.update
);

router.delete("/:cardId", checkAuth, CardController.remove);

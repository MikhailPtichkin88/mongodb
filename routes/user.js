import {Router} from "express";
import {UserController} from "../controllers/index.js";
import {
  handleValidationErrors,
  checkAuth,
  savePicture,
  deletePicture,
} from "../utils/index.js";
import {
  registerValidation,
  loginValidation,
  updateUserDataValidation,
} from "../validations.js";
import {fileURLToPath} from "url";
import {dirname, resolve} from "path";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MAX_SIZE = 3 * 1024 * 1024;
export const router = new Router();

router.post(
  "/registration",
  registerValidation,
  handleValidationErrors,
  UserController.register
);
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  UserController.login
);

router.get("/me", checkAuth, UserController.me);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const directory = resolve(__dirname, "..", "uploads", "avatars");
    if (!fs.existsSync(directory)) {
      // Создание директории
      fs.mkdirSync(directory);
      console.log("Директория успешно создана.");
    }
    cb(null, directory);
  },
  // savePicture - сохраняем саму картинку и записываем ее имя в req.pictureName
  filename: function (req, file, cb) {
    savePicture(req, file, cb, "avatar");
  },
});

const upload = multer({
  storage,
  limits: {fileSize: MAX_SIZE},
});

router.patch(
  "/update",
  checkAuth,
  upload.single("avatar"),
  updateUserDataValidation,
  handleValidationErrors,
  UserController.update
);
router.delete(
  "/deleteAvatar",
  checkAuth,
  deletePicture("avatar"),
  UserController.deleteAvatar
);

router.post("/resetPassword", UserController.resetPassword);
router.post("/setNewPassword", UserController.setNewPassword);

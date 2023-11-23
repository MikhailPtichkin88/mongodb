import {Router} from "express";
import {UserController} from "../controllers/index.js";
import {
  handleValidationErrors,
  checkAuth,
  savePicture,
} from "../utils/index.js";
import {
  registerValidation,
  loginValidation,
  updateUserDataValidation,
} from "../validations.js";
import multer from "multer";

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
    cb(null, "uploads/avatars");
  },
  // savePicture - сохраняем саму картинку и записываем ее имя в req.pictureName
  filename: function (req, file, cb) {
    savePicture(req, file, cb, "avatar");
  },
});

const upload = multer({
  storage,
  limits: {fileSize: 1000000},
});

router.patch(
  "/update",
  checkAuth,
  upload.single("avatar"),
  updateUserDataValidation,
  handleValidationErrors,
  UserController.update
);

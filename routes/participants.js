import {Router} from "express";
import {ParticipantController} from "../controllers/index.js";
import {
  handleValidationErrors,
  checkAuth,
  savePicture,
} from "../utils/index.js";

import multer from "multer";

export const router = new Router();

// router.get("/", checkAuth, SessionController.getAll);

// router.get("/:sessionId", checkAuth, SessionController.getOne);

router.post("/", checkAuth, ParticipantController.create);

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/sessions");
//   },
//   // savePicture - сохраняем саму картинку и записываем ее имя в req.pictureName
//   filename: function (req, file, cb) {
//     savePicture(req, file, cb, "session");
//   },
// });

// const upload = multer({
//   storage,
//   limits: {fileSize: 1000000},
// });

// router.patch(
//   "/:sessionId",
//   checkAuth,
//   upload.single("session_img"),
//   sessionUpdateValidation,
//   handleValidationErrors,
//   SessionController.update
// );

// router.delete("/:sessionId", checkAuth, SessionController.remove);

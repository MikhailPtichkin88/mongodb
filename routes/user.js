import {Router} from "express";
import {UserController} from "../controllers/index.js";
import {handleValidationErrors, checkAuth} from "../utils/index.js";
import {registerValidation, loginValidation} from "../validations.js";

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
// router.patch("/", checkAuth, UserController.updateUser);

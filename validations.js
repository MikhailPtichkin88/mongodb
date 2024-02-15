import {body, query} from "express-validator";
import mongoose from "mongoose";

export const registerValidation = [
  body("email", "Неверный формат почты").isEmail(),
  body("passwordHash", "Пароль должен быть минимум 5 символов").isLength({
    min: 5,
  }),
  body("fullName", "Укажите имя").optional().isLength({min: 3}),
  body("avatarUrl", "Неверная ссылка на аватарку").optional().isURL(),
];

export const loginValidation = [
  body("email", "Неверный формат почты").isEmail(),
  body("passwordHash", "Пароль должен быть минимум 5 символов").isLength({
    min: 5,
  }),
];

export const updateUserDataValidation = [
  body("email", "Неверный формат почты").optional().isEmail(),
  body("fullName", "Имя должно быть более 2 символов")
    .optional()
    .isLength({min: 3}),
];

export const titleAndDescrValidation = [
  body("title", "Название должно быть не менее 3 символов")
    .optional()
    .isLength({min: 3})
    .isString(),
  body("session_info", "Описание сессии должно быть более 3 символов")
    .optional()
    .isLength({
      min: 3,
    })
    .isString(),
  body("card_info", "Описание Карточки должно быть более 3 символов")
    .optional()
    .isLength({
      min: 3,
    })
    .isString(),
];

export const selectCardValidation = [
  query("sessionId").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(
        "У query параметра 'sessionId' неверный формат ID или параметр отсутствует"
      );
    }
    return true;
  }),
];

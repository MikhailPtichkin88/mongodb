import UserModel from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {sendEmail} from "../utils/index.js";

const register = async (req, res) => {
  try {
    const userWithSameEmail = await UserModel.findOne({email: req.body.email});
    if (userWithSameEmail) {
      return res.status(400).json({message: "Такой email уже используется"});
    }
    const password = req.body.passwordHash;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const doc = new UserModel({
      email: req.body.email,
      fullName: req.body.fullName,
      avatarUrl: req.body.avatarUrl,
      passwordHash: hash,
    });
    const user = await doc.save();
    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.SECRET_KEY,
      {expiresIn: "30d"}
    );
    const {passwordHash, ...userData} = user._doc;
    res.json({userData, token});
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось зарегистрироваться"});
  }
};

const login = async (req, res) => {
  try {
    const user = await UserModel.findOne({email: req.body.email});
    if (!user) {
      return res.status(404).json({message: "Пользоватьель не найден"});
    }
    const isValidPassword = await bcrypt.compare(
      req.body.passwordHash,
      user._doc.passwordHash
    );
    if (!isValidPassword) {
      return res.status(404).json({message: "Неверный логин или пароль"});
    }
    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.SECRET_KEY,
      {expiresIn: "30d"}
    );
    const {passwordHash, ...userData} = user._doc;
    res.json({userData, token});
  } catch (error) {
    console.log(error);

    return res.status(500).json({message: "Не удалось авторизоваться"});
  }
};

const me = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({message: "Пользователь не найден"});
    }

    const {passwordHash, ...userData} = user._doc;
    res.json(userData);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось авторизоваться"});
  }
};

const update = async (req, res) => {
  try {
    const userId = req.userId;

    if (!Object.keys(req.body).length && !req.pictureName) {
      console.log(req.body);
      return res.status(400).json({error: "Данные для обновления отсутствуют"});
    }
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await UserModel.findOne({
      email: req.body.email,
      _id: {$ne: userId},
    });

    if (existingUser) {
      return res
        .status(400)
        .json({error: "Email уже используется другим пользователем"});
    }

    // Создаем объект с обновленными данными пользователя на основе того, что пришло в запросе
    const updatedUserData = {
      email: req.body.email,
      fullname: req.body.fullname,
      city: req.body.city,
      age: req.body.age,
    };

    if (req.pictureName) {
      updatedUserData.avatarUrl = req.pictureName;
    }

    // Обновляем данные пользователя в базе данных
    const updatedUser = await UserModel.findOneAndUpdate(
      {_id: userId},
      updatedUserData,
      {new: true}
    );

    if (updatedUser) {
      return res.status(200).json(updatedUser);
    } else {
      return res.status(404).json({error: "Пользователь не найден"});
    }
  } catch (err) {
    return res
      .status(500)
      .json({message: "Произошла ошибка при обновлении данных пользователя"});
  }
};

const resetPassword = async (req, res) => {
  try {
    const {email} = req.body;
    const user = await UserModel.findOne({email});
    if (!user) {
      return res.status(404).json({message: "Пользователь не найден"});
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.SECRET_KEY,
      {expiresIn: "1h"}
    );

    await sendEmail(email, token);
    return res.json({
      message: "Ссылка для восстановления пароля отправлена на почту",
    });
  } catch (error) {
    return res.status(500).json({message: "Ошибка восстановления пароля"});
  }
};

const setNewPassword = async (req, res) => {
  try {
    const {password} = req.body;
    const token = (req.body.token || "").replace(/Bearer\s?/, "");

    if (!token || !password) {
      return res.status(404).json({message: "Некорректные данные"});
    }
    const {_id} = jwt.verify(token, process.env.SECRET_KEY);
    const user = await UserModel.findOne({_id});

    if (!user) {
      return res.status(404).json({message: "Пользователь не найден"});
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    user.passwordHash = encryptedPassword;
    await user.save();

    return res.json({
      message: "Пароль успешно изменен",
    });
  } catch (error) {
    return res.status(500).json({message: "Ошибка восстановления пароля"});
  }
};

const deleteAvatar = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await UserModel.findOne({_id: userId});

    if (!user) {
      return res.status(404).json({message: "Пользователь не найден"});
    }

    user.avatarUrl = null;
    await user.save();

    return res.json({
      message: "Аватар успешно удален",
    });
  } catch (error) {
    return res.status(500).json({message: "Ошибка восстановления пароля"});
  }
};
export {
  register,
  login,
  me,
  update,
  resetPassword,
  setNewPassword,
  deleteAvatar,
};

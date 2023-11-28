import UserModel from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
    const user = await UserModel.findById(userId);

    if (!user.avatarUrl && req.pictureName) {
      await UserModel.findOneAndUpdate(
        {_id: userId},
        {avatarUrl: req.pictureName}
      );
    }
    if (req.body.email) {
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

      await UserModel.findOneAndUpdate({_id: userId}, {email: req.body.email});
    }

    if (req.body.fullName) {
      await UserModel.findOneAndUpdate(
        {_id: userId},
        {fullName: req.body.fullName}
      );
    }

    const updatedUser = await UserModel.findById(userId);
    return res.json(updatedUser);
  } catch (err) {
    return res
      .status(500)
      .json({message: "Произошла ошибка при обновлении данных пользователя"});
  }
};

export {register, login, me, update};

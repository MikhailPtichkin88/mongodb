import SessionModel from "../models/Session.js";
import CardModel from "../models/Card.js";
import ParticipantModel from "../models/Participant.js";
import fs from "fs";
import path from "path";

const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "title",
      sortOrder = "desc",
      status = "all",
      role = "creator",
      search = "",
    } = req.query;

    const userId = req.userId;
    const sortDirection = sortOrder === "desc" ? -1 : 1;

    const statusFilter =
      status === "active"
        ? ["opened", "in_progress"]
        : status === "closed"
        ? ["closed"]
        : ["opened", "in_progress", "closed"];

    let totalDocs;
    let participantIds;
    if (role === "creator") {
      totalDocs = await SessionModel.countDocuments({
        created_by: userId,
        status: {$in: statusFilter},
        title: {$regex: new RegExp(search, "i")},
      });
    } else {
      const matchingParticipants = await ParticipantModel.find({user: userId});
      participantIds = matchingParticipants.map(
        (participant) => participant._id
      );
      totalDocs = await SessionModel.countDocuments({
        created_by: {$ne: userId},
        participants: {$in: participantIds},
        title: {$regex: new RegExp(search, "i")},
      });
    }

    const totalPages = Math.ceil(totalDocs / limit);

    const pagination = {
      currentPage: Number(page),
      totalPages: totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
      limit: parseInt(limit),
      total: totalDocs,
    };

    let data;
    if (role === "creator") {
      data = await SessionModel.find({
        created_by: userId,
        status: {$in: statusFilter},
        title: {$regex: new RegExp(search, "i")},
      })
        .sort({[sortBy]: sortDirection})
        .limit(Number(limit))
        .skip((page - 1) * limit);
    } else {
      data = await SessionModel.find({
        created_by: {$ne: userId},
        participants: {$in: participantIds},
        title: {$regex: new RegExp(search, "i")},
      })
        .sort({[sortBy]: sortDirection})
        .limit(Number(limit))
        .skip((page - 1) * limit);
    }
    res.json({data, pagination});
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить cессии"});
  }
};

const getOne = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await SessionModel.findById({_id: sessionId})
      .populate({path: "cards", select: "-selected_by"})
      .populate({
        path: "participants",
        populate: {path: "user", select: "fullName avatarUrl _id"},
      });

    if (!session) {
      return res.status(500).json({message: "Ошибка при поиске сессии"});
    }
    return res.json(session);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить сессию"});
  }
};

const create = async (req, res) => {
  try {
    console.log(req.userId);
    const doc = new SessionModel({
      created_by: req.userId,
      title: req.body.title,
      session_info: req.body.session_info,
      total_participants: req.body.total_participants,
      status: "opened",
    });
    const session = await doc.save();
    res.json(session);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось создать сессию"});
  }
};

const remove = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.userId;

    const deletedSession = await SessionModel.findOneAndDelete({
      _id: sessionId,
      created_by: userId,
    });

    if (!deletedSession) {
      return res.status(500).json({message: "Ошибка при удалении сессии"});
    }

    await CardModel.deleteMany({session_id: sessionId});
    await ParticipantModel.deleteMany({session_id: sessionId});
    // удаление картинки сессии
    if (deletedSession.session_img) {
      const directory = `uploads/sessions`;

      fs.readdir(directory, (err, files) => {
        if (err) {
          console.error("Ошибка при чтении директории:", err);
          return;
        }
        files.forEach((file) => {
          const filePath = path.join(directory, file);

          if (file.includes(sessionId)) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error("Ошибка при удалении файла:", err);
                return;
              }
              console.log(`Файл ${file} успешно удален.`);
            });
          }
        });
      });
    }
    // удаление папки с картинками карт
    if (deletedSession.cards.length) {
      const directory = `uploads/cards/${sessionId}`;
      fs.readdir(directory, (err, files) => {
        if (err) {
          console.error("Ошибка при чтении директории:", err);
          return;
        }
        // Удаление каждого файла
        files.forEach((file) => {
          const filePath = path.join(directory, file);
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Ошибка при удалении файла ${file}:`, err);
              return;
            }
            console.log(`Файл ${file} успешно удален.`);
          });
        });

        // Удаление пустой папки
        fs.rmdir(directory, (err) => {
          if (err) {
            console.error("Ошибка при удалении папки:", err);
            return;
          }
          console.log("Папка успешно удалена.");
        });
      });
    }

    const sessions = await SessionModel.find({created_by: userId});

    return res.json(sessions);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось удалить сессию"});
  }
};

const update = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const updatedSession = await SessionModel.findOneAndUpdate(
      {_id: sessionId},
      {
        title: req.body.title,
        session_img: req.pictureName,
        session_info: req.body.session_info,
      },
      {returnDocument: "after"}
    );
    return res.json(updatedSession);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось обновить статью"});
  }
};

const deleteImg = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.userId;

    const session = await SessionModel.findOne({
      _id: sessionId,
      created_by: userId,
    });

    if (!session) {
      return res.status(404).json({message: "Сессия не найдена"});
    }

    session.session_img = null;
    await session.save();

    return res.json({
      message: "Картинка сессии успешно удалена",
    });
  } catch (error) {
    return res.status(500).json({message: "Ошибка восстановления пароля"});
  }
};

export {getAll, getOne, create, update, remove, deleteImg};

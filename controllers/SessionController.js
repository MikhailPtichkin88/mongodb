import SessionModel from "../models/Session.js";

const getAll = async (req, res) => {
  const userId = req.userId;
  try {
    const sessions = await SessionModel.find({created_by: userId})
      .populate({
        path: "cards",
        select: "-selected_by",
      })
      .populate({
        path: "participants",
        populate: {path: "user", select: "fullName avatar _id"},
      });
    res.json(sessions);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить cессии"});
  }
};

const getOne = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await SessionModel.findById({_id: sessionId})
      .populate({path: "cards"})
      .populate({
        path: "participants",
        populate: {path: "user", select: "fullName avatar _id"},
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
    const doc = new SessionModel({
      created_by: req.userId,
      title: req.body.title,
      session_info: req.body.session_info,
      total_participants: req.body.total_participants,
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
    });

    if (!deletedSession) {
      return res.status(500).json({message: "Ошибка при удалении сессии"});
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

export {getAll, getOne, create, update, remove};

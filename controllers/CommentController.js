import CommentModel from "../models/Comment.js";

const getAll = async (req, res) => {
  const {sessionId} = req.query;
  try {
    const comments = await CommentModel.find({session_id: sessionId}).populate({
      path: "user",
      select: "_id avatarUrl fullName",
    });
    res.json(comments);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить комментарии"});
  }
};

const create = async (req, res) => {
  try {
    const {sessionId, text} = req.body;
    const userId = req.userId;

    const doc = new CommentModel({
      user: userId,
      session_id: sessionId,
      text,
    });
    await doc.save();

    const comments = await CommentModel.find({session_id: sessionId}).populate({
      path: "user",
      select: "_id avatarUrl fullName",
    });

    res.json(comments);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось создать комментарий"});
  }
};

const edit = async (req, res) => {
  try {
    const {commentId, text} = req.body;

    if (!text || text.length < 3) {
      return res
        .status(400)
        .json({message: "Текст комментария должен быть более 3 символов"});
    }

    const comment = await CommentModel.findOne({
      _id: commentId,
      user: req.userId,
    }).populate({
      path: "user",
      select: "_id avatarUrl fullName",
    });
    if (!comment) {
      return res.status(400).json({message: "Комментарий не найден"});
    }
    comment.text = text;
    await comment.save();

    return res.json(comment);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Ошибка обновления комментария"});
  }
};

const remove = async (req, res) => {
  try {
    const {commentId} = req.query;
    const userId = req.userId;

    await CommentModel.findOneAndDelete({_id: commentId, user: userId});

    return res.json({success: true});
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось удалить комментарий"});
  }
};

export {getAll, edit, create, remove};

import ParticipantModel from "../models/Participant.js";
import SessionModel from "../models/Session.js";
import CardModel from "../models/Card.js";

const getAll = async (req, res) => {
  const sessionId = req.query.sessionId;
  try {
    const participants = await ParticipantModel.find({
      session_id: sessionId,
    }).populate({path: "user", select: "_id fullName avatarUrl"});

    res.json(participants);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить cессии"});
  }
};

const create = async (req, res) => {
  try {
    const session = await SessionModel.findOne({
      _id: req.body.session_id,
    });

    if (!session) {
      return res
        .status(500)
        .json({message: "Сессии не существует, или она была удалена"});
    }

    if (session.participants?.length === session.total_participants) {
      return res.status(403).json({
        message:
          "Достигнуто максимальное количество участников в рамках сессии",
      });
    }

    const participants = await ParticipantModel.find({
      session_id: req.body.session_id,
    }).populate({path: "user", select: "_id"});

    if (
      participants?.find((participant) => {
        return participant?.user?._id?.toString() === req.userId;
      })
    ) {
      return res.status(400).json({
        message: "Вы уже являетесь участником данной сессии",
      });
    }

    const doc = new ParticipantModel({
      user: req.userId,
      session_id: req.body.session_id,
      has_picked_own_card: false,
      has_picked_random_card: false,
    });
    const participant = await doc.save();

    session.participants = [...participants.map((p) => p._id), participant._id];
    await session.save();

    const updatedParticipants = await ParticipantModel.find({
      session_id: req.body.session_id,
    }).populate({path: "user", select: "_id fullName avatarUrl"});

    res.json(updatedParticipants);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось создать участника"});
  }
};

const bindUser = async (req, res) => {
  const {card_id, bind_user_id, session_id} = req.body;

  const updatedCard = await CardModel.findOne({_id: card_id});
  const updatedParticipant = await ParticipantModel.findOne({
    user: req.userId,
    session_id,
  });

  //функционал удаления отметки своей карты
  if (!bind_user_id) {
    try {
      updatedCard.user_id = null;
      updatedParticipant.has_picked_own_card = false;

      await updatedCard.save();
      await updatedParticipant.save();

      return res.json(updatedParticipant);
    } catch (error) {
      return res
        .status(500)
        .json({message: "Ошибка удаления выбора своей карты"});
    }
  }

  try {
    updatedCard.user_id = req.userId;
    updatedParticipant.has_picked_own_card = true;

    await updatedCard.save();
    await updatedParticipant.save();

    return res.json(updatedParticipant);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Ошибка выбора своей карты"});
  }
};

const remove = async (req, res) => {
  try {
    const participantId = req.query.participantId;
    const userId = req.userId;

    const deletedParticipant = await ParticipantModel.findOneAndDelete({
      _id: participantId,
      user: userId,
    });
    if (!deletedParticipant) {
      return res
        .status(404)
        .json({message: "Некорректный id участника (ошибка поиска)"});
    }

    const hasCreatedCard = deletedParticipant.has_picked_own_card;
    let deletedCard;
    if (hasCreatedCard) {
      deletedCard = await CardModel.findOneAndDelete({
        session_id: deletedParticipant.session_id,
        created_by: deletedParticipant.user,
      });
    }

    return res.json({deletedParticipant, deletedCard});
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось удалить участника"});
  }
};

export {getAll, bindUser, create, remove};

import ParticipantModel from "../models/Participant.js";
import SessionModel from "../models/Session.js";
import CardModel from "../models/Card.js";
import CommnetModal from "../models/Card.js";

const getAll = async (req, res) => {
  const sessionId = req.query.sessionId;
  try {
    const participants = await ParticipantModel.find({
      session_id: sessionId,
    }).populate({path: "user", select: "_id fullName avatarUrl email"});

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

    const participants = await ParticipantModel.find({
      session_id: req.body.session_id,
    }).populate({path: "user", select: "_id"});

    if (!participants) {
      return res.status(500).json({message: "Ошибка получения участников"});
    }

    if (participants?.length === session.total_participants) {
      return res.status(403).json({
        message:
          "Достигнуто максимальное количество участников в рамках сессии",
      });
    }

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
    await doc.save();

    const updatedParticipants = await ParticipantModel.find({
      session_id: req.body.session_id,
    }).populate({path: "user", select: "_id fullName avatarUrl email"});

    res.json(updatedParticipants);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось создать участника"});
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

    await CommnetModal.deleteMany({
      session_id: deletedParticipant.session_id,
      user: deletedParticipant.user,
    });

    return res.json({deletedParticipant, deletedCard});
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось удалить участника"});
  }
};

export {getAll, create, remove};

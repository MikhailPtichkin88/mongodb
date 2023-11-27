import CardModel from "../models/Card.js";
import SessionModel from "../models/Session.js";
import ParicipantModel from "../models/Participant.js";

const remove = async (req, res) => {
  try {
    const session = await SessionModel.findOne({
      _id: req.query.sessionId,
    }).populate({
      path: "participants",
      populate: {path: "user", select: "_id"},
    });

    if (session && session.status !== "opened") {
      return res.status(403).json({
        error: "Удалить карточку можно только в сессии в статусе 'Открыта'",
      });
    }
    if (session.created_by !== req.userId) {
      return res
        .status(403)
        .json({message: "Удалить карточку может только создатель сессии"});
    }
    const deleteCard = await CardModel.findOneAndDelete({
      _id: req.params.cardId,
    });

    if (!deleteCard) {
      return res.status(500).json({
        message:
          "Ошибка при поиске карты (карта уже удалена или не существует)",
      });
    }

    if (deleteCard.user_id) {
      const participant = ParicipantModel.findOne({
        session_id: session._id,
        user: deleteCard.user_id,
      });
      console.log(participant);
      participant.has_picked_own_card = false;
      participant.user = null;

      const participantIndex = session.participants.findIndex((participant) => {
        console.log(participant.user._id);
        console.log(deleteCard.user_id);

        return participant.user._id === deleteCard.user_id;
      });
      session.participants[participantIndex].has_picked_own_card = false;
      await participant.save();
    }
    session.cards = session.cards?.filter((id) => {
      return id?.toString() !== req.params.cardId;
    });
    await session.save();
    const cards = await CardModel.find({session_id: req.query.sessionId});

    return res.json(cards);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось удалить карточку"});
  }
};

import ParticipantModel from "../models/Participant.js";
import SessionModel from "../models/Session.js";
import CardModel from "../models/Card.js";

const getAll = async (req, res) => {
  const sessionId = req.query.sessionId;
  try {
    const participants = await ParticipantModel.find({
      session_id: sessionId,
    }).populate({path: "user", select: "_id fullName avatar"});

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
    }).populate({
      path: "participants",
      populate: {path: "user", select: "_id"},
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
    if (
      session.participants?.find((participant) => {
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

    session.participants = [...session.participants, participant._id];
    await session.save();

    res.json(participant);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось создать участника"});
  }
};

const bindUser = async (req, res) => {
  const {card_id, bind_user_id} = req.body;

  //функционал удаления отметки своей карты
  if (!bind_user_id) {
    try {
      const updatedCard = await CardModel.findOneAndUpdate(
        {_id: card_id},
        {
          user_id: null,
        },
        {returnDocument: "after"}
      );

      const session = await SessionModel.findOne({
        _id: updatedCard.session_id,
      });

      const participantToUpdate = session.participants.find((participant) =>
        participant?.user_id?.equals(req.userId)
      );
      if (participantToUpdate) {
        participantToUpdate.has_picked_own_card = false;
      }

      const updatedParticipant = await ParticipantModel.findOneAndUpdate(
        {user: {_id: req.userId}},
        {has_picked_own_card: false},
        {new: true}
      );
      await session.save();
      return res.json(updatedParticipant);
    } catch (error) {
      return res
        .status(500)
        .json({message: "Ошибка удаления выбора своей карты"});
    }
  }

  try {
    const updatedCard = await CardModel.findOneAndUpdate(
      {_id: card_id},
      {
        user_id: bind_user_id,
      },
      {returnDocument: "after"}
    );

    const session = await SessionModel.findOne({
      _id: updatedCard.session_id,
    });

    const participantToUpdate = session.participants.find((participant) =>
      participant?.user?.equals(req.userId)
    );
    if (participantToUpdate) {
      participantToUpdate.has_picked_own_card = true;
    }

    const updatedParticipant = await ParticipantModel.findOneAndUpdate(
      {user: bind_user_id},
      {has_picked_own_card: true},
      {new: true}
    );
    await session.save();
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

    const participantToDelete = await ParticipantModel.findOne({
      _id: participantId,
    });
    if (!participantToDelete) {
      return res
        .status(404)
        .json({message: "Некорректный id участника (ошибка поиска)"});
    }
    const sessionId = participantToDelete.session_id;

    if (participantToDelete.has_picked_random_card) {
      return res
        .status(403)
        .json({message: "Нельзя удалить участника, который уже выбрал карту"});
    }

    const session = await SessionModel.findOne({_id: sessionId}).populate({
      path: "participants",
      populate: {path: "user", select: "fullName avatar _id"},
    });

    if (session && session.created_by?.toString() !== userId) {
      return res
        .status(403)
        .json({message: "Удалять участников может только создатель сессии"});
    }

    await ParticipantModel.deleteOne({_id: participantToDelete._id});
    session.participants = session.participants?.filter((participant) => {
      return (
        participant._id?.toString() !== participantToDelete._id?.toString()
      );
    });

    await session?.save();
    return res.json(session.participants);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось удалить участника"});
  }
};

export {getAll, bindUser, create, remove};

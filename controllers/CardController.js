import CardModel from "../models/Card.js";
import SessionModel from "../models/Session.js";
import ParicipantModel from "../models/Participant.js";

// получение всех карт в рамках одной сессии
const getAll = async (req, res) => {
  try {
    const cards = await CardModel.find({
      session_id: req.query.sessionId,
    }).select("-selected_by");

    res.json(cards);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить cессии"});
  }
};

const create = async (req, res) => {
  try {
    const session = await SessionModel.findOne({_id: req.body.sessionId});

    if (session && session.created_by?.toString() !== req.userId) {
      return res
        .status(403)
        .json({error: "Создавать карту может только создатель сессии"});
    }
    if (session && session.cards?.length === session.total_participants) {
      return res.status(400).json({
        error: "Количество карт не должно быть больше количества участников",
      });
    }

    const doc = new CardModel({
      created_by: req.userId,
      session_id: req.body.sessionId,
      title: req.body.title,
    });
    const card = await doc.save();

    session.cards = [...session.cards, card._id];
    await session.save();

    res.json(card);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось создать карточку"});
  }
};

const update = async (req, res) => {
  try {
    // const sessionId = req.query.session_id;
    const cardId = req.params.cardId;
    const updatedCard = await CardModel.findOneAndUpdate(
      {_id: cardId},
      {
        title: req.body.title,
        card_img: req.pictureName,
        card_info: req.body.card_info,
        session_id: req.query.sessionId,
      },
      {returnDocument: "after"}
    );
    return res.json(updatedCard);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось обновить карточку"});
  }
};

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
    if (session.created_by?.toString() !== req.userId) {
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
      const participant = await ParicipantModel.findOne({
        session_id: session._id,
        user: deleteCard.user_id,
      });

      participant.has_picked_own_card = false;

      session.participants = session.participants.map((participant) => {
        return participant.user?._id?.toString() ===
          deleteCard.user_id?.toString()
          ? {...participant, has_picked_own_card: false}
          : participant;
      });

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

const chooseCard = async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    const userId = req.userId;
    const eligibleCards = await CardModel.find({session_id: sessionId});

    const filteredCards = eligibleCards.filter((card) => {
      return (
        !(card?.user_id && card?.user_id?.toString() === userId) &&
        !card?.selected_by
      );
    });
    // Выбрать случайную карту из пула
    const randomIndex = Math.floor(Math.random() * filteredCards.length);
    const selectedCard = filteredCards[randomIndex];

    // Обновить ключ selected_by для выбранной карты
    selectedCard.selected_by = userId;
    await selectedCard.save();

    // обновление Participant
    const participant = await ParicipantModel.findOne({user: userId});
    if (!participant) {
      return res.status(500).json({error: "Ошибка при обновлении участника"});
    }
    participant.has_picked_random_card = true;

    await participant.save();
    
    // обновление сессии
    try {
      const session = await SessionModel.findOne({
        _id: selectedCard.session_id,
      }).populate("participants");

      if (session.status === "opened") {
        session.status = "in_progress";
      }

      if (
        session.participants.length === session.total_participants &&
        session.participants.every(
          (participant) => participant.has_picked_random_card
        )
      ) {
        session.status = "closed";
      }

      await session.save();
    } catch (error) {
      return res
        .status(500)
        .json({error: "Ошибка при обновлении участников в сессии"});
    }

    res.json(selectedCard);
  } catch (error) {
    res.status(500).json({error: "Ошибка при выборе случайной карты"});
  }
};

export {
  getAll,
  update,
  remove,
  create,
  // bindUser,
  chooseCard,
};

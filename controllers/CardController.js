import CardModel from "../models/Card.js";
import SessionModel from "../models/Session.js";
import ParicipantModel from "../models/Participant.js";

// получение всех карт в рамках одной сессии
const getAll = async (req, res) => {
  try {
    const cards = await CardModel.find({session_id: req.query.sessionId});
    res.json(cards);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить cессии"});
  }
};

const create = async (req, res) => {
  try {
    const doc = new CardModel({
      created_by: req.userId,
      session_id: req.query.sessionId,
      title: req.body.title,
    });
    const card = await doc.save();

    await SessionModel.findOneAndUpdate(
      {_id: req.query.sessionId},
      {
        $push: {cards: card._id},
      }
    );
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
    const deleteCard = await CardModel.findOneAndDelete({
      _id: req.params.cardId,
    });

    if (!deleteCard) {
      return res.status(500).json({message: "Ошибка при удалении карточки"});
    }
    const cards = await CardModel.find({session_id: req.query.sessionId});

    return res.json(cards);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось удалить карточку"});
  }
};

// const bindUser = async (req, res) => {
//   try {
//     const cardId = req.params.cardId;
//     const updatedCard = await CardModel.findOneAndUpdate(
//       {_id: cardId},
//       {
//         user_id: req.body.user_id,
//       },
//       {returnDocument: "after"}
//     );
//      // обновление Participant
//      try {
//       await ParicipantModel.findOneAndUpdate(
//         {user_id: userId},
//         {has_picked_random_card: true},
//         {new: true}
//       );
//     } catch (error) {
//       return res.status(500).json({error: "Ошибка при обновлении участника"});
//      }

//     return res.json(updatedCard);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось обновить карточку"});
//   }
// };

const chooseCard = async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    const userId = req.userId;
    const eligibleCards = await CardModel.find({session_id: sessionId});

    const filteredCards = eligibleCards.filter(
      (card) => !card?.user_id?.equals(userId) && !card?.selected_by
    );

    // Выбрать случайную карту из пула
    const randomIndex = Math.floor(Math.random() * filteredCards.length);
    const selectedCard = filteredCards[randomIndex];

    // Обновить ключ selected_by для выбранной карты
    selectedCard.selected_by = userId;
    await selectedCard.save();

    // обновление Participant
    try {
      await ParicipantModel.findOneAndUpdate(
        {user_id: userId},
        {has_picked_random_card: true},
        {new: true}
      );
    } catch (error) {
      return res.status(500).json({error: "Ошибка при обновлении участника"});
    }

    // обновление Participant  в рамках данной сессии
    try {
      const session = await SessionModel.findOne({
        _id: selectedCard.session_id,
      });

      const participantToUpdate = session.participants.find((participant) =>
        participant?.user_id?.equals(userId)
      );
      if (participantToUpdate) {
        participantToUpdate.has_picked_random_card = true;
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

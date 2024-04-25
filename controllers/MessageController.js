import Message from "../models/Message.js";
import Card from "../models/Card.js";

// кейс: мы Санта и уточняем делатли у того, кому мы дарим подарок
const sendMessageFromSanta = async (req, res) => {
  const {sessionId, cardId, cardToId, text} = req.body;

  try {
    if (!sessionId || !cardId || !text) {
      return res.status(400).send("All fields are required");
    }

    const newMessage = new Message({
      session_id: sessionId,
      card_from: cardId,
      card_to: cardToId,
      text: text,
    });

    await newMessage.save();
    res.status(201).send("Message sent successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// кейс: когда мы отвечаем санте на его сообщения
const sendMessageToSanta = async (req, res) => {
  const {sessionId, text} = req.body;
  const userId = req.userId;
  try {
    if (!sessionId || !text) {
      return res.status(400).send("All fields are required");
    }
    const myCard = await Card.findOne({
      session_id: sessionId,
      created_by: userId,
    }).lean();

    const santaId = myCard?.selected_by?.toString();
    const santaCard = await Card.findOne({
      created_by: santaId,
      session_id: sessionId,
    });

    if (!santaCard) {
      return res.status(404).send("Santa's card not found");
    }

    const newMessage = new Message({
      session_id: sessionId,
      card_from: myCard._id,
      card_to: santaCard._id,
      text: text,
    });

    await newMessage.save();
    res.status(201).send("Message sent successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// кейс: я Санта, подгружаю сообщения мои и того, кому я дарю подарок
const getMessagesFromSanta = async (req, res) => {
  const {sessionId, cardId, cardToId} = req.query;
  if (!sessionId || !cardId || !cardToId) {
    return res.status(400).send("Некорректные входящие данные");
  }
  try {
    const messages = await Message.find({
      session_id: sessionId,
    })
      .or([
        {card_from: cardId, card_to: cardToId},
        {card_from: cardToId, card_to: cardId},
      ])
      .lean();

    res.json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить cессии"});
  }
};

// кейс: я отвечаю Санте, подгружаю сообщения мои и его
const getMessagesToSanta = async (req, res) => {
  const {sessionId} = req.query;
  const userId = req.userId;
  try {
    const myCard = await Card.findOne({
      session_id: sessionId,
      created_by: userId,
    }).lean();

    const santaId = myCard?.selected_by?.toString();
    const santaCard = await Card.findOne({
      created_by: santaId,
      session_id: sessionId,
    }).lean();

    if (!santaCard) {
      return res.status(404).send("Santa's card not found");
    }
    const myCardId = myCard?._id.toString();
    const santaCardId = santaCard?._id.toString();

    const messages = await Message.find({
      session_id: sessionId,
    }).or([
      {card_from: myCardId, card_to: santaCardId},
      {card_from: santaCardId, card_to: myCardId},
    ]);

    res.json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить cессии"});
  }
};

const editMessage = async (req, res) => {
  const {messageId, sessionId, text} = req.body;
  const userId = req.userId;
  const card = await Card.findOne({
    session_id: sessionId,
    created_by: userId,
  }).lean();
  try {
    if (!messageId || !text) {
      return res.status(400).send("Нет необходимых данных");
    }
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).send("Сообщение не найдено");
    }

    if (message.card_from?.toString() !== card?._id?.toString()) {
      return res
        .status(404)
        .send("Менять сообщение может только его создатель");
    }
    message.text = text;
    await message.save();
    res.send("Сообщение успешно обновлено");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export {
  sendMessageFromSanta,
  sendMessageToSanta,
  getMessagesToSanta,
  getMessagesFromSanta,
  editMessage,
};

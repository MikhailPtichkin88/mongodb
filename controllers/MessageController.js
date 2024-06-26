import Message from "../models/Message.js";
import Card from "../models/Card.js";
import Session from "../models/Session.js";

import events from "events"
const emitter = new events.EventEmitter()
emitter.setMaxListeners(20);

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
      is_new_to: true,
    });

    await newMessage.save();

    // когда мы Санта, то затираем привязку к карточке отправителя
    emitter.emit("newMessage", {...newMessage?.toObject(), card_from: null})

    res.status(201).json(newMessage);
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
      is_new_to: true,
    });

    await newMessage.save();

    emitter.emit("newMessage", newMessage?.toObject())

    res.status(201).json(newMessage);
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

        // при получении отмечаем все сообщения, посланные текущему юзеру, как прочитанные
        const updMessages = []

        for (let message of messages) {
            
          if(message?.card_to?.toString() === cardId && message.is_new_to === true) {
            message.is_new_to = false
            await message.save()
          }
          updMessages.push(message)
        }
    
    res.json(updMessages);
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
    ])

    // при получении отмечаем все сообщения, посланные текущему юзеру, как прочитанные
    const updMessages = []

    for (let message of messages) {
        
      if(message?.card_to?.toString() === myCardId && message.is_new_to === true) {
        message.is_new_to = false
        await message.save()
        delete message.card_from
      }
      updMessages.push(message)
      }

    res.json(updMessages);
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
    res.status(200).json(message);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getNewMessages = async (req, res) => {
  const userId = req.userId;
  try {

    const myCards = await Card.find({
      created_by: userId,
    }).select('session_id')
    
    let messages = []

    for(let card of myCards) {
      const cardId = card._id.toString()
      const sessionId = card.session_id
      
      const session = await Session.findOne({ _id: sessionId }).select("title -_id")
    
      const newMessages = await Message.countDocuments({ session_id: sessionId, card_to: cardId, is_new_to: true })
    
      if (newMessages) {
        messages.push({sessionId, sessionTitle: session.title, count: newMessages})
      }
    }

  return res.json(messages)
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось получить cессии"});
  }
};

 
const subscribe = async (req, res) => {
  const cardId = req?.query?.cardId;
  const sessionId = req?.query?.sessionId;

  // через emmitter.once не работает один из чатов, имитируем с помощью emitter.on
  const listener = async (message) => {
    if (message?.card_to?.toString() === cardId && message.session_id?.toString() === sessionId) {
      emitter.removeListener("newMessage", listener); // Удаление слушателя сразу после его срабатывания
      const updMessage = await Message.findById(message?._id);
      updMessage.is_new_to = false;
      await updMessage.save();
      res.json({...updMessage.toObject(), card_from: message?.card_from});
    }
  };

  emitter.on("newMessage", listener);

  // Отключение слушателя, если клиент отключился
  req.on('close', () => {
    emitter.removeListener("newMessage", listener);
  });
};

const getNewMessagesCount = async (req, res) => {
  const userId = req.userId;

    // через emmitter.once не работает один из чатов, имитируем с помощью emitter.on
  const listener = async (message) => {
      try {
        const cards = await Card.find({ created_by: userId }).select('created_by').lean()

      if (cards?.some(card => card._id.toString() === message?.card_to?.toString()) && message?.is_new_to) {
        emitter.removeListener("newMessage", listener); 
        const session = await Session.findById(message?.session_id)
        res.json({sessionId: message?.session_id, sessionTitle: session?.title, text: message?.text});
      }
      } catch (error) {
        console.log(error)
      }
    };
    emitter.on("newMessage", listener);
  
    // Отключение слушателя, если клиент отключился
    req.on('close', () => {
      emitter.removeListener("newMessage", listener);
    });
}

export {
  sendMessageFromSanta,
  sendMessageToSanta,
  getMessagesToSanta,
  getMessagesFromSanta,
  editMessage,
  getNewMessages,
  subscribe,
  getNewMessagesCount
};

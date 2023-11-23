import ParticipantModel from "../models/Participant.js";
import SessionModel from "../models/Session.js";

// const getAll = async (req, res) => {
//   const userId = req.userId;
//   try {
//     const cards = await CardModel.find({session_id: userId})
//       .populate({path: "cards"})
//       .populate({
//         path: "participants",
//         populate: {path: "user_id"},
//       })
//       .catch((err) => console.log(err));
//     res.json(sessions);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось получить cессии"});
//   }
// };

// const getOne = async (req, res) => {
//   try {
//     const sessionId = req.params.sessionId;
//     const session = await SessionModel.findById({_id: sessionId})
//       .populate("cards")
//       .populate({
//         path: "participants",
//         populate: {path: "userId"},
//       });

//     if (!session) {
//       return res.status(500).json({message: "Ошибка при поиске сессии"});
//     }
//     return res.json(session);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось получить сессию"});
//   }
// };

const create = async (req, res) => {
  try {
    const doc = new ParticipantModel({
      user_id: req.userId,
      session_id: req.body.session_id,
      has_picked_own_card: false,
      has_picked_random_card: false,
    });
    const participant = await doc.save();

    await SessionModel.findOneAndUpdate(
      {_id: req.body.session_id},
      {
        $push: {participants: participant._id},
      }
    );
    res.json(participant);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Не удалось создать карточку"});
  }
};

// const remove = async (req, res) => {
//   try {
//     const sessionId = req.params.sessionId;
//     const userId = req.userId;
//     const deletedPost = await SessionModel.findOneAndDelete({_id: sessionId});

//     if (!deletedPost) {
//       return res.status(500).json({message: "Ошибка при удалении сессии"});
//     }
//     const sessions = await SessionModel.find({created_by: userId});

//     return res.json(sessions);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось удалить сессию"});
//   }
// };

// const update = async (req, res) => {
//   try {
//     const sessionId = req.params.sessionId;
//     const updatedSession = await SessionModel.findOneAndUpdate(
//       {_id: sessionId},
//       {
//         title: req.body.title,
//         session_img: req.body.session_img,
//         session_info: req.body.session_info,
//       },
//       {returnDocument: "after"}
//     );
//     return res.json(updatedSession);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось обновить статью"});
//   }
// };

export {
  // getAll, getOne, update, remove,

  create,
};

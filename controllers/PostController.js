// import PostModel from "../models/Post.js";

// export const getAll = async (req, res) => {
//   try {
//     const posts = await PostModel.find().populate("user").exec();
//     res.json(posts);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось получить статьи"});
//   }
// };

// export const getOne = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const post = await PostModel.findOneAndUpdate(
//       {_id: postId},
//       {$inc: {veiwsCout: 1}},
//       {returnDocument: "after"}
//     );

//     if (!post) {
//       return res.status(500).json({message: "Ошибка при поиске статьи"});
//     }
//     return res.json(post);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось получить статью"});
//   }
// };

// export const create = async (req, res) => {
//   try {
//     const doc = new PostModel({
//       title: req.body.title,
//       text: req.body.title,
//       imageUrl: req.body.imageUrl,
//       tags: req.body.tags,
//       user: req.userId,
//     });
//     const post = await doc.save();
//     res.json(post);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось создать статью"});
//   }
// };

// export const remove = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const deletedPost = await PostModel.findOneAndDelete({_id: postId});

//     if (!deletedPost) {
//       return res
//         .status(500)
//         .json({message: "Ошибка при удалении статьи статьи"});
//     }
//     return res.json({success: true});
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось удалить статью"});
//   }
// };

// export const update = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     await PostModel.updateOne(
//       {_id: postId},
//       {
//         title: req.body.title,
//         text: req.body.text,
//         imageUrl: req.body.imageUrl,
//         user: req.userId,
//         tags: req.body.tags,
//       }
//     );
//     return res.json({success: true});
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({message: "Не удалось обновить статью"});
//   }
// };

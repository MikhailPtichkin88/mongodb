import mongoose from "mongoose";

const CardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    card_img: {
      type: String,
    },
    card_info: {
      type: String,
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // привязка к юзеру, который изображен на этой карте
    // функционал "отметь себя, перед тем как выбрать карту"
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // привязка к юзеру, которому досталась эта карта в рамках сессии
    selected_by: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Card", CardSchema);

import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    session_img: {
      type: String,
    },
    session_info: {
      type: String,
    },
    status: {
      type: String,
      required: true,
    },
    total_participants: {
      type: Number,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant",
        default: [],
      },
    ],

    cards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Session", SessionSchema);

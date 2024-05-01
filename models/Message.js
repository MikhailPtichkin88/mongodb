import mongoose from "mongoose";
const {Schema} = mongoose;

const MessageSchema = new Schema(
  {
    text: {type: String, required: true},
    session_id: {type: Schema.Types.ObjectId, ref: "Session", required: true},
    card_from: {type: Schema.Types.ObjectId, ref: "Card", required: true},
    card_to: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    is_new_to: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", MessageSchema);

import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  has_picked_own_card: Boolean,
  has_picked_random_card: Boolean,
});

export default mongoose.model("Participant", ParticipantSchema);

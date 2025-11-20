const mongoose = require("mongoose");

const rewardHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  binId: { type: String, required: true },
  bottles: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("RewardHistory", rewardHistorySchema);

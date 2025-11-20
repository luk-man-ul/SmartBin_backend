const BinCount = require("../models/BinCount");
const RewardHistory = require("../models/RewardHistory");
const User = require("../models/User");


// 1️⃣ ESP32 / YOLO → send count to backend
exports.updateCount = async (req, res) => {
  const { binId, count } = req.body;
  console.log(req.body)
  await BinCount.updateOne(
    { binId },
    { $inc: { count }, $set: { updatedAt: new Date() } },
    { upsert: true }
  );

  res.json({ success: true });
};

// 2️⃣ OPTIONAL: frontend → get live count
exports.getCount = async (req, res) => {
  const { binId } = req.params;
  const doc = await BinCount.findOne({ binId });

  res.json({ count: doc ? doc.count : 0 });
};


// 3️⃣ User scans QR → claim reward
exports.claimReward = async (req, res) => {
  const { userId, binId } = req.body;

  const doc = await BinCount.findOne({ binId });

  if (!doc || doc.count === 0) {
    return res.json({ success: false, message: "No pending reward." });
  }

  // Add reward to user
  await User.updateOne(
    { _id: userId },
    { $inc: { rewardPoints: doc.count } }
  );

  // Save reward history
  await RewardHistory.create({
    userId,
    binId,
    bottles: doc.count
  });

  // Reset bin count
  await BinCount.deleteOne({ binId });

  res.json({
    success: true,
    reward: doc.count,
    message: "Reward added!"
  });
};

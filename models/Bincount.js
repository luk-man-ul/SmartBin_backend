const mongoose = require("mongoose");

const binCountSchema = new mongoose.Schema({
  binId: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

// TTL index
binCountSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model("BinCount", binCountSchema);

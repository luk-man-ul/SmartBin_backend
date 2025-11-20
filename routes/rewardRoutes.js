const express = require("express");
const router = express.Router();
const RewardHistory = require("../models/RewardHistory");

// Get all reward history for a user
router.get("/:userId", async (req, res) => {
  try {
    const history = await RewardHistory.find({
      userId: req.params.userId
    }).sort({ date: -1 });

    res.json(history);
  } catch (error) {
    console.error("Error fetching reward history:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

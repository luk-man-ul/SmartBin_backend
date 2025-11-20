const express = require("express");
const router = express.Router();
const binController = require("../controllers/binController");

// ESP32 → backend
router.post("/updateCount", binController.updateCount);

// frontend → backend
router.get("/getCount/:binId", binController.getCount);

// QR scan → claim rewards
router.post("/claim", binController.claimReward);

module.exports = router;

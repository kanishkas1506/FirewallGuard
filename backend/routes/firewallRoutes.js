
const express = require("express");
const router = express.Router();

const {
  createRule,
  getRules,
  getRuleById,
  updateRule,
  deleteRule,
  getStats,
  getHistory
} = require("../controllers/firewallController");

// CREATE RULE
router.post("/add", createRule);

// GET ALL RULES
router.get("/all", getRules); 
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FirewallGuard API is running",
    endpoints: {
      allRules: "/api/firewall/all",
      stats: "/api/firewall/stats",
      history: "/api/firewall/history"
    }
  });
});

// DASHBOARD STATISTICS
router.get("/stats", getStats);

// ACTIVITY HISTORY
router.get("/history", getHistory);

// GET SINGLE RULE
router.get("/:id", getRuleById);

// UPDATE RULE
router.put("/:id", updateRule);

// DELETE RULE
router.delete("/:id", deleteRule);

module.exports = router;

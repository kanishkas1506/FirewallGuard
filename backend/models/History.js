
const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FirewallRule",
      default: null
    },
    ruleName: {
      type: String,
      default: "Unknown Rule"
    },
    eventType: {
      type: String,
      enum: [
        "RULE_CREATED",
        "RULE_REJECTED",
        "RULE_UPDATED",
        "RULE_DELETED"
      ],
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    action: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("History", historySchema);
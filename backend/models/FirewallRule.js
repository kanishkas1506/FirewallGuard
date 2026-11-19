
const mongoose = require("mongoose");

const firewallRuleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      default: "Unnamed Rule",
      trim: true
    },

    sourceIP: {
      type: String,
      default: ""
    },

    destinationIP: {
      type: String,
      default: ""
    },

    port: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    protocol: {
      type: String,
      default: ""
    },

    action: {
      type: String,
      default: ""
    },

    validationStatus: {
      type: String,
      enum: ["Valid", "Invalid"],
      required: true
    },

    ruleStatus: {
      type: String,
      enum: ["Active", "Blocked", "Invalid"],
      required: true
    },

    validationErrors: {
      type: [String],
      default: []
    },

    dfaTrace: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "FirewallRule",
  firewallRuleSchema
);

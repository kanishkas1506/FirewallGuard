
const mongoose = require("mongoose");

const FirewallRule = require("../models/FirewallRule");
const History = require("../models/History");

const {
  validateFirewallRule
} = require("../utils/validator");

const {
  runDFA
} = require("../utils/dfa");

const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

// NORMALIZE INPUT
function normalizeRule(data = {}) {
  const protocol = String(data.protocol || "")
    .trim()
    .toUpperCase();

  const rawAction = String(data.action || "")
    .trim()
    .toLowerCase();

  return {
    ruleName:
      typeof data.ruleName === "string"
        ? data.ruleName.trim()
        : "",

    sourceIP:
      typeof data.sourceIP === "string"
        ? data.sourceIP.trim()
        : "",

    destinationIP:
      typeof data.destinationIP === "string"
        ? data.destinationIP.trim()
        : "",

    port:
      protocol === "ICMP" ||
      data.port === "" ||
      data.port === undefined ||
      data.port === null
        ? null
        : Number(data.port),

    protocol,

    action:
      rawAction === "allow"
        ? "Allow"
        : rawAction === "deny"
          ? "Deny"
          : data.action
  };
}

// VALIDATE USING REGEX + DFA


function validateRule(data) {
  const validation = validateFirewallRule(data);

  const fieldChecks = {
    ruleNameValid:
      typeof data.ruleName === "string" &&
      /^[A-Za-z0-9][A-Za-z0-9 _-]{2,49}$/.test(data.ruleName.trim()),

    sourceIPValid:
      typeof data.sourceIP === "string" &&
      ipv4Regex.test(data.sourceIP),

    destinationIPValid:
      typeof data.destinationIP === "string" &&
      ipv4Regex.test(data.destinationIP),

    portValid:
      data.protocol === "ICMP"
        ? data.port === null
        : Number.isInteger(data.port) &&
          data.port >= 1 &&
          data.port <= 65535,

    protocolValid: ["TCP", "UDP", "ICMP"].includes(data.protocol),
    actionValid: ["Allow", "Deny"].includes(data.action)
  };
  console.log("DFA INPUT CHECKS:", fieldChecks);
  const dfa = runDFA(data, fieldChecks);
  console.log("DFA FINAL RESULT:", dfa);

  const errors = [...validation.errors];

  if (!dfa.accepted && errors.length === 0) {
    errors.push("Firewall rule rejected by DFA validation.");
  }

  return {
    isValid: validation.isValid && dfa.accepted,
    errors,
    dfa
  };
}


// SAVE HISTORY
async function saveHistory({
  ruleId,
  ruleName,
  eventType,
  description,
  action
}) {
  try {
    await History.create({
      ruleId,
      ruleName,
      eventType,
      description,
      action: action || ""
    });
  } catch (error) {
    console.error("History recording error:", error);
  }
}

// CREATE RULE
exports.createRule = async (req, res) => {
  try {
    const normalized = normalizeRule(req.body);
    const result = validateRule(normalized);

    const rule = await FirewallRule.create({
      ...normalized,

      validationStatus:
        result.isValid ? "Valid" : "Invalid",

      ruleStatus: result.isValid
        ? normalized.action === "Allow"
          ? "Active"
          : "Blocked"
        : "Invalid",

      validationErrors: result.errors,
      dfaTrace: result.dfa.trace
    });

    await saveHistory({
      ruleId: rule._id,
      ruleName: rule.ruleName,

      eventType: result.isValid
        ? "RULE_CREATED"
        : "RULE_REJECTED",

      description: result.isValid
        ? "Firewall rule created successfully."
        : result.errors.join(" "),

      action: rule.action
    });

    return res.status(result.isValid ? 201 : 400).json({
      success: result.isValid,

      message: result.isValid
        ? "Firewall rule created successfully."
        : "Firewall rule validation failed.",

      rule,

      validation: {
        status: rule.validationStatus,
        errors: result.errors
      },

      dfa: {
        finalState: result.dfa.finalState,
        trace: result.dfa.trace
      }
    });

  } catch (error) {
    console.error("Create rule error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating firewall rule."
    });
  }
};

// UPDATE RULE
exports.updateRule = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rule ID."
      });
    }

    const existingRule = await FirewallRule.findById(
      req.params.id
    );

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        message: "Firewall rule not found."
      });
    }

    const normalized = normalizeRule(req.body);
    const result = validateRule(normalized);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: "Updated firewall rule validation failed.",

        validation: {
          status: "Invalid",
          errors: result.errors
        },

        dfa: {
          finalState: result.dfa.finalState,
          trace: result.dfa.trace
        }
      });
    }

    Object.assign(existingRule, {
      ...normalized,

      validationStatus: "Valid",

      ruleStatus:
        normalized.action === "Allow"
          ? "Active"
          : "Blocked",

      validationErrors: [],
      dfaTrace: result.dfa.trace
    });

    await existingRule.save();

    await saveHistory({
      ruleId: existingRule._id,
      ruleName: existingRule.ruleName,
      eventType: "RULE_UPDATED",
      description: "Firewall rule updated successfully.",
      action: existingRule.action
    });

    return res.status(200).json({
      success: true,
      message: "Firewall rule updated successfully.",
      rule: existingRule,

      validation: {
        status: "Valid",
        errors: []
      },

      dfa: {
        finalState: result.dfa.finalState,
        trace: result.dfa.trace
      }
    });

  } catch (error) {
    console.error("Update rule error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update firewall rule."
    });
  }
};

// GET ALL RULES
exports.getRules = async (req, res) => {
  try {
    const rules = await FirewallRule.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rules.length,
      rules
    });

  } catch (error) {
    console.error("Get rules error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve firewall rules."
    });
  }
};

// GET SINGLE RULE
exports.getRuleById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rule ID."
      });
    }

    const rule = await FirewallRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Firewall rule not found."
      });
    }

    return res.status(200).json({
      success: true,
      rule
    });

  } catch (error) {
    console.error("Get single rule error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve rule."
    });
  }
};

// DELETE RULE
exports.deleteRule = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rule ID."
      });
    }

    const rule = await FirewallRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Firewall rule not found."
      });
    }

    await saveHistory({
      ruleId: rule._id,
      ruleName: rule.ruleName,
      eventType: "RULE_DELETED",
      description: "Firewall rule deleted.",
      action: rule.action
    });

    await FirewallRule.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Firewall rule deleted successfully."
    });

  } catch (error) {
    console.error("Delete rule error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete firewall rule."
    });
  }
};

// DASHBOARD STATISTICS
exports.getStats = async (req, res) => {
  try {
    const [
      total,
      valid,
      invalid,
      active,
      blocked
    ] = await Promise.all([
      FirewallRule.countDocuments(),

      FirewallRule.countDocuments({
        validationStatus: "Valid"
      }),

      FirewallRule.countDocuments({
        validationStatus: "Invalid"
      }),

      FirewallRule.countDocuments({
        ruleStatus: "Active"
      }),

      FirewallRule.countDocuments({
        ruleStatus: "Blocked"
      })
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        valid,
        invalid,
        active,
        blocked
      }
    });

  } catch (error) {
    console.error("Stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve dashboard statistics."
    });
  }
};

// ACTIVITY HISTORY
exports.getHistory = async (req, res) => {
  try {
    const history = await History.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });

  } catch (error) {
    console.error("History error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve activity history."
    });
  }
};

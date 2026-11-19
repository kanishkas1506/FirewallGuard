
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

const ruleNameRegex =
  /^[A-Za-z0-9][A-Za-z0-9 _-]{2,49}$/;

function validateFirewallRule(data) {
  const errors = [];

  if (
    typeof data.ruleName !== "string" ||
    !ruleNameRegex.test(data.ruleName.trim())
  ) {
    errors.push("Rule name must contain 3-50 valid characters.");
  }

  if (
    typeof data.sourceIP !== "string" ||
    !ipv4Regex.test(data.sourceIP.trim())
  ) {
    errors.push("Invalid source IPv4 address.");
  }

  if (
    typeof data.destinationIP !== "string" ||
    !ipv4Regex.test(data.destinationIP.trim())
  ) {
    errors.push("Invalid destination IPv4 address.");
  }

  const protocol = String(data.protocol || "")
    .trim()
    .toUpperCase();

  if (!["TCP", "UDP", "ICMP"].includes(protocol)) {
    errors.push("Protocol must be TCP, UDP or ICMP.");
  }

  if (protocol === "TCP" || protocol === "UDP") {
    const port = Number(data.port);

    if (
      data.port === "" ||
      data.port === null ||
      data.port === undefined ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      errors.push(
        "TCP/UDP port must be between 1 and 65535."
      );
    }
  }

  if (
    protocol === "ICMP" &&
    data.port !== null &&
    data.port !== "" &&
    data.port !== undefined
  ) {
    errors.push("ICMP does not use TCP/UDP port numbers.");
  }

  const action = String(data.action || "")
    .trim()
    .toLowerCase();

  if (!["allow", "deny"].includes(action)) {
    errors.push("Action must be Allow or Deny.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateFirewallRule
};

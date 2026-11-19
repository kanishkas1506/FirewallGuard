
const STATES = [
  "START",
  "RULE_NAME",
  "SOURCE_IP",
  "DESTINATION_IP",
  "PORT",
  "PROTOCOL",
  "ACTION",
  "ACCEPT",
  "REJECT"
];

const TRANSITIONS = {
  START: { valid: "RULE_NAME", invalid: "REJECT" },
  RULE_NAME: { valid: "SOURCE_IP", invalid: "REJECT" },
  SOURCE_IP: { valid: "DESTINATION_IP", invalid: "REJECT" },
  DESTINATION_IP: { valid: "PORT", invalid: "REJECT" },
  PORT: { valid: "PROTOCOL", invalid: "REJECT" },
  PROTOCOL: { valid: "ACTION", invalid: "REJECT" },
  ACTION: { valid: "ACCEPT", invalid: "REJECT" }
};

function runDFA(data, validation) {
  const checks = [
    validation.ruleNameValid,
    validation.sourceIPValid,
    validation.destinationIPValid,
    validation.portValid,
    validation.protocolValid,
    validation.actionValid
  ];

  let currentState = "START";
  const trace = ["START"];

  // Move to RULE_NAME before checking the six fields
  currentState = TRANSITIONS.START.valid;
  trace.push(currentState);

  for (const valid of checks) {
    currentState = TRANSITIONS[currentState][
      valid ? "valid" : "invalid"
    ];

    trace.push(currentState);

    if (currentState === "REJECT") break;
  }

  return {
    states: STATES,
    finalState: currentState,
    accepted: currentState === "ACCEPT",
    trace
  };
}

module.exports = { runDFA, STATES, TRANSITIONS };

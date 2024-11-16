const fs = require("fs")
const { Location, ReturnType, CodeLanguage } = require("@chainlink/functions-toolkit")
require("@chainlink/env-enc").config();

// Configure the request by setting the fields below
const requestConfig = {
  // String containing the source code to be executed
  source: fs.readFileSync("./functions/sources/test.js").toString(),
  //source: fs.readFileSync("./API-request-example.js").toString(),
  // Location of source code (only Inline is currently supported)
  codeLocation: Location.Inline,
  // Optional. Secrets can be accessed within the source code with `secrets.varName` (ie: secrets.apiKey). The secrets object can only contain string values.
  secrets: { alpacaKey: process.env.ALPACA_API_KEY ?? "", alpacaSecret: process.env.ALPACA_API_SECRET ?? "" },
  // Optional if secrets are expected in the sourceLocation of secrets (only Remote or DONHosted is supported)
  secretsLocation: Location.DONHosted,
  // TSLA amount, USDC amount
  args: ["1", "10"],
  // Code language (only JavaScript is currently supported)
  codeLanguage: CodeLanguage.JavaScript,
  // Expected type of the returned value
  expectedReturnType: ReturnType.uint256,
  // Increasing the source code execution time from default (10000ms) to 60 sec to allow for execution of function waitForOrderToFill
  maxExecutionTimeMs: 120000,
  // Increasing the source code execution HTTP queries from default (5) to 20 queries to allow for execution of function waitForOrderToFill
  numAllowedQueries: 20,
}

module.exports = requestConfig
## RWA (Real World Assets) with Chainlink and Tesla Stocks

### Scope and Limitations

This project integrates Solidity smart contracts with JavaScript to enable buying and selling of stocks through a Web3 interface. It utilizes Chainlink for secure data feeds and functions feature to execute orders and Alpaca as the broker API for trading interactions.

#### Scope
- **Minting Tokens Based on Broker Holdings**: Users can mint tokens that represent the stocks held in a test broker account.
- **Data Integration with Chainlink**: Chainlink facilitates secure API calls and data feeds, providing reliable stock data within the project.

#### Limitations
- **Broker API Test Environment Constraints**: The Alpaca test environment has limitations, despite documentation stating full functionality. This restricts the ability to simulate a live trading environment and impacts the reliability of some workflows.
- **Exclusion of Redemption Feature**: Due to these constraints, this project does not include a redeeming mechanism, meaning tokens cannot be converted back into stock holdings. Only minting based on stock holdings is available.
- **Chainlink API Limitations**: Any issues or limitations with Chainlink functions may affect API call performance and data retrieval.

---

### Documentation

Chainlink documentation used during this project:
* [Chainlink Functions](https://docs.chain.link/chainlink-functions/getting-started)
* [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1)
* [Chainlink Chateau](https://chateau.voyage/)
* [Patrick Collins tutorial](https://www.youtube.com/watch?v=KNUchSEtQV0)
* [Chainlink Functions Upload Secrets - gist](https://gist.github.com/SyedAsadKazmi/215a2a88d2d65c84ae7bccf2e7c0efe5#file-upload-secrets-gist-js)

### Packages required
```shell
forge install smartcontractkit/chainlink-brownie-contracts@0.8.0 --no-commit
forge install openzeppelin/openzeppelin-contracts --no-commit
```


### Other Requirements for [Functions](https://www.npmjs.com/package/@chainlink/functions-toolkit)

Installing Deno is a prerequisite for the `functions-toolkit`:

```bash
curl -fsSL https://deno.land/install.sh | sh
```

Install the `functions-toolkit`:

```bash
npm i @chainlink/functions-toolkit
```
> Note: if any issues during toolkit installation, head to the [**Troubleshooting**](#troubleshooting) section

### Broker: [Alpaca](https://alpaca.markets/)
* Sign up to paper trading (no real money)
* Generate 2FA
* Generate API key and secret from home page
    

For Production these credentials can be saved using this chainlink tutorial steps:
https://docs.chain.link/chainlink-functions/tutorials/api-query-parameters

>Note: For this demo we are not really capturing the TSLA stocks purchased but the portfolio balance.

### Capturing Portfolio Balance from Alpaca:

```bash
npm run simulate
```
Output:
```
> simulate
> node -r dotenv/config ./functions/simulators/alpacaMintSimulator.js

secp256k1 unavailable, reverting to browser version
Response returned by script: 9995019
```

> Note: if any issue during test related to µWS Binary Incompatibility, head to the [**Troubleshooting**](#troubleshooting) section

### Uploading Alpaca credentials to GIST:

```
node ./functions/uploadSecretsGist.js 
secp256k1 unavailable, reverting to browser version
Creating gist...

✅Gist created https://gist.github.com/luigicallero/7fefe74dfe038fca0410a078504c2be9/raw . Encrypt the URLs..

✅Encrypted Secrets Url: 0x4edf46669cf5d3d8d438021204820dfa02b1a0c9ea9e16370c30e2d7db918b5ba2484ce113865fdb177dcfa7732bafbe8bb66442b7bb6575f2b241c3961bb6b3b081ee98f8c17963ce585caf385dfcb38faedda3e2d685e06b792889424ea750691f9d08c8a03e2a699794d0d1a90d8d37ff5249cde82cd9d17f38e458e7d7e48c6a7d5068679829f8d889ad66e29d21b122c9b052121be1d65984193613428178
```

### Uploading Alpaca credentials to DON (Decentralized Oracle Networks)
> Before attempting this feature, make sure you follow all pre-requisites in [Chainlink documentation](https://docs.chain.link/chainlink-functions/tutorials/api-use-secrets#prerequisites). Failure to comply will end in errors as seen in [**Troubleshooting**](#troubleshooting) section.

```bash
npm run .rwa-creator/functions/uploadSecrets
```
Output:
```
secp256k1 unavailable, reverting to browser version
Uploading encrypted secret to gateways https://01.functions-gateway.testnet.chain.link/,https://02.functions-gateway.testnet.chain.link/. slotId 0. Expiration in minutes: 1440

✅ Secrets uploaded properly to gateways https://01.functions-gateway.testnet.chain.link/,https://02.functions-gateway.testnet.chain.link/! Gateways response:  { version: 1731698029, success: true }

✅ Secrets version: 1731698029
Encrypted secrets object written to ../rwa-creator/offchain-secrets.json
```

### Checking the Secrets in DON are accessible:
```bash
npm ./functions/uploadSecrets
```
Output:
```
secp256k1 unavailable, reverting to browser version

Estimate request costs...
Fulfillment cost estimated to 3.47310173292942659 LINK

Make request...

✅ Functions request sent! Transaction hash 0xbc33d00be6431ff32b4d50110b7adeca82f3bbedcc1d9578c514ff76f3380619. Waiting for a response...
See your request in the explorer https://sepolia.etherscan.io/tx/0xbc33d00be6431ff32b4d50110b7adeca82f3bbedcc1d9578c514ff76f3380619

✅ Request 0x9c6864dc7756aae5186656a43baac927348df6f840e1fbbda578e499ae9bff44 successfully fulfilled. Cost is 0.258170855939618535 LINK.Complete reponse:  {
  requestId: '0x9c6864dc7756aae5186656a43baac927348df6f840e1fbbda578e499ae9bff44',
  subscriptionId: 3661,
  totalCostInJuels: 258170855939618535n,
  responseBytesHexstring: '0x0000000000000000000000000000000000000000000000000000000000b510e2',
  errorString: '',
  returnDataBytesHexstring: '0x',
  fulfillmentCode: 0
}

✅ Decoded response to uint256:  11866338n
```

## Crypto Wallet requirement on Alpaca:
Check with forum:
https://app.slack.com/client/TD8AD6C1J/C03RLJLDF2M
Error received: 404 Not found

Awaiting response from support.

Also review this documentations
https://docs.alpaca.markets/docs/crypto-wallets-api#step-3-deposit-funds-to-your-alpaca-wallet
> Only to work on production with Goerli which has been deprecated

---
## Troubleshooting
### Issue: `node-gyp` Build Error During Installation

When attempting to install the `@chainlink/functions-toolkit` package, you may encounter the following error:

```
npm ERR! make: g++: No such file or directory
npm ERR! make: *** [bcrypto.target.mk:149: Release/obj.target/bcrypto.node] Error 127
```

This error is caused by missing system dependencies (`g++` and other build tools) required to compile native modules such as `bcrypto`.

### Solution: Install Build Tools

To resolve this issue, install the necessary build tools by running the following command:

```bash
sudo apt update
sudo apt install build-essential
```

After the installation is complete, re-run the package installation command:

```bash
npm install
```

This should resolve the issue and allow the installation to complete successfully.

Here's a tutorial in the same format for your issue with the µWS binary:

---

### Issue: µWS Binary Incompatibility with Node.js Version

When running a project that uses `@chainlink/functions-toolkit` and `ganache`, you may encounter the following error related to µWS (micro WebSockets):

```
This version of µWS is not compatible with your Node.js build:
Error: Cannot find module '../binaries/uws_linux_x64_120.node'
Require stack:
- /path/to/project/node_modules/ganache/node_modules/@trufflesuite/uws-js-unofficial/src/uws.js
...
Falling back to a NodeJS implementation; performance may be degraded.
```

This error occurs when the µWS module is not compatible with your current Node.js version, typically due to missing or incompatible binaries for the version of Node.js you are using.

### Solution: Switch to a Compatible Node.js Version

To resolve this issue, switch to a Node.js version that has compatible prebuilt µWS binaries. In this case, switching to Node.js version 20.11.1 resolved the issue.

1. First, ensure you have `nvm` (Node Version Manager) installed. If not, follow the [nvm installation guide](https://github.com/nvm-sh/nvm#installing-and-updating).

2. Install Node.js version 20.11.1 using `nvm`:

    ```bash
    nvm install v20.11.1
    ```

3. Use the newly installed version:

    ```bash
    nvm use v20.11.1
    ```

4. Reinstall your project's dependencies:

    ```bash
    npm install
    ```

This should resolve the µWS binary compatibility issue, and your project will fall back to the proper implementation without performance degradation.


---
## Chainlink Function `simulateScript` Execution Notes

### Issue Encountered
During the execution of the Chainlink function `simulateScript`, it was discovered that the default parameter limitations were preventing the script from executing properly.

### Default Parameter Values
- **Max Execution Time**: 10,000 ms
- **Max HTTP Requests**: 5
> Default values can be found in file: .../rwa-creator/node_modules/@chainlink/functions-toolkit/dist/simulationConfig.d.ts

These default settings were insufficient for the requirements of the script, causing execution failures.

### Solution
To enable the script to run successfully, the following adjustments were made:
- **Max Execution Time (`maxExecutionMs`)** was increased from `10,000 ms` to `80,000 ms`.
- **Max HTTP Requests (`HTTPRequest`)** was increased from `5` to `20`.

### Steps to Modify Parameters
1. Open the configuration file or relevant script settings for `simulateScript`.
2. Update the `maxExecutionMs` parameter to:
   ```javascript
   maxExecutionMs = 80000;
   ```
3. Update the `HTTPRequest` variable to:
   ```javascript
   HTTPRequest = 20;
   ```

### Outcome
These changes allowed the script to properly execute within the new parameter limits, resolving the execution issues experienced with the default settings.

---
## Chainlink Function `uploadSecret` Execution Notes

### Issue Encountered
This is the common output when executing this command without the proper pre-requisites. Follow the instructions in [Chainlink documentation](https://docs.chain.link/chainlink-functions/tutorials/api-use-secrets#prerequisites).

```
secp256k1 unavailable, reverting to browser version
Uploading encrypted secret to gateways https://01.functions-gateway.testnet.chain.link/,https://02.functions-gateway.testnet.chain.link/. slotId 0. Expiration in minutes: 1440
Error encountered when attempting to send request to DON gateway URL #1 of 2
https://01.functions-gateway.testnet.chain.link/:
{"jsonrpc":"2.0","id":"1531748447","error":{"code":-32600,"message":"sender not allowlisted"}}
Error encountered when attempting to send request to DON gateway URL #2 of 2
https://02.functions-gateway.testnet.chain.link/:
{"jsonrpc":"2.0","id":"666024233","error":{"code":-32600,"message":"sender not allowlisted"}}
Error: Failed to send request to any of the DON gateway URLs:
["https://01.functions-gateway.testnet.chain.link/","https://02.functions-gateway.testnet.chain.link/"]
    at SecretsManager.sendMessageToGateways (.../rwa-creator/node_modules/@chainlink/functions-toolkit/dist/SecretsManager.js:214:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SecretsManager.uploadEncryptedSecretsToDON (.../rwa-creator/node_modules/@chainlink/functions-toolkit/dist/SecretsManager.js:155:33)
    at async uploadSecrets (.../rwa-creator/functions/uploadSecrets.js:63:30)
```
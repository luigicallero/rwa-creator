## RWA (Real World Assets) with Chainlink and Tesla Stocks

### Documentation:

Chainlink documentation used during this project:
* Functions: https://docs.chain.link/chainlink-functions/getting-started
* Price Feeds: https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1
* Chateau: https://chateau.voyage/
* Patrick Collins tutorial: https://www.youtube.com/watch?v=KNUchSEtQV0

### Contracts required
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

### Uploading Alpaca credentials to DON (Descentralized Oracle Networks):

```bash
npm run uploadSecrets
```
Output (under investigation with Chainlink support on discord):
```
> uploadSecrets
> node -r dotenv/config ./functions/uploadSecrets.js

secp256k1 unavailable, reverting to browser version
Upload encrypted secret to gateways https://01.functions-gateway.testnet.chain.link/,https://02.functions-gateway.testnet.chain.link/. slotId 0. Expiration in minutes: 1440
Error encountered when attempting to send request to DON gateway URL #1 of 2
https://01.functions-gateway.testnet.chain.link/:
{"jsonrpc":"2.0","id":"3695638116","error":{"code":-32600,"message":"sender not allowlisted"}}
Error encountered when attempting to send request to DON gateway URL #2 of 2
https://02.functions-gateway.testnet.chain.link/:
{"jsonrpc":"2.0","id":"3778223220","error":{"code":-32600,"message":"sender not allowlisted"}}
```




---


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
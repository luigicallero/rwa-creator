/**
 * THIS IS AN EXAMPLE SCRIPT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE SCRIPT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
require("@chainlink/env-enc").config()

const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN

const { SecretsManager, createGist } = require("@chainlink/functions-toolkit");
const ethers = require("ethers");

const uploadSecrets = async () => {
    // hardcoded for Sepolia
    const routerAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0"
    const donId = "fun-ethereum-sepolia-1"

    // Initialize ethers signer and provider to interact with the contracts onchain
    const privateKey = process.env.PRIVATE_KEY;


    if (!privateKey)
        throw new Error(
            "private key not provided - check your environment variables"
        );

    const rpcUrl = process.env.SEPOLIA_RPC_URL;

    if (!rpcUrl)
        throw new Error(`rpcUrl not provided  - check your environment variables`);

    const secrets = {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_API_SECRET
    };
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey);
    const signer = wallet.connect(provider); // create ethers signer for signing transactions

    // First encrypt secrets and create a gist
    const secretsManager = new SecretsManager({
        signer: signer,
        functionsRouterAddress: routerAddress,
        donId: donId,
    });
    await secretsManager.initialize();

    // Encrypt secrets
    const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

    console.log(`Creating gist...`);
    const githubApiToken = GITHUB_API_TOKEN;
    if (!githubApiToken)
        throw new Error(
            "githubApiToken not provided - check your environment variables"
        );

    // Create a new GitHub Gist to store the encrypted secrets
    const gistURL = await createGist(
        githubApiToken,
        JSON.stringify(encryptedSecretsObj)
    );
    console.log(`\n✅Gist created ${gistURL} . Encrypt the URLs..`);
    const encryptedSecretsUrls = await secretsManager.encryptSecretsUrls([
        gistURL,
    ]);

    console.log(`\n✅Encrypted Secrets Url: ${encryptedSecretsUrls}`);
};

uploadSecrets().catch((e) => {
    console.error(e);
    process.exit(1);
});
-include .env

.PHONY: deploy

deploy :; @forge script script/DeployDTsla.s.sol --sender 0xEBD4d0B170DB82b91506c5a6895D70b6a509d976 --account test-wallet --rpc-url ${SEPOLIA_RPC_URL} --etherscan-api-key ${ETHERSCAN_API_KEY} --priority-gas-price 1 --verify --broadcast

# private-key stored using "cast wallet import private-key XXXXXXX NEW-ACCOUNT-NAME"
// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/*
 * @title dTSLA
 * @author Luis Callero
*/
contract dTSLA is ConfirmedOwner, FunctionsClient, ERC20 {
    using FunctionsRequest for FunctionsRequest.Request;
    using Strings for uint256;

    error dTSLA__NotEnoughCollateral();
    error dTSLA__DoesntMeetMinimumWithdrawalAmount();
    error dTSLA__TransferFailed();

    enum MintOrRedeem {
        mint,
        redeem
    }

    struct dTslaRequest {
        uint256 amountOfToken;
        address requester;
        MintOrRedeem mintOrRedeem;
    }

    // Math Constants
    uint256 constant PRECISION = 1e18;

    // Constants
    address constant SEPOLIA_FUNCTIONS_ROUTER = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    bytes32 constant DON_ID = hex"66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000";
    address constant SEPOLIA_TSLA_PRICE_FEED = 0xc59E3633BAAC79493d908e63626716e204A45EdF; // this is actually LINK/USD for the demo
    address constant SEPOLIA_USDC_PRICE_FEED = 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E; // USDC/USD
    address constant SEPOLIA_USDC = 0x8Ed065267b0835eB6229f8fa6295e65735bf2520; // fake Sepolia USDC
    uint256 constant ADDITIONAL_FEED_PRECISION = 1e10;
    uint32 constant GAS_LIMIT = 300_000;
    uint256 constant COLLATERAL_RATIO = 200; // 200% collateral ratio
    // If there is $200 of TSLA in the brokerage, we can mint AT MOST $100 of dTSLA
    uint256 constant COLLATERAL_PRECISION = 100;
    uint256 constant MINIMUM_WITHDRAWAL_AMOUNT = 100e18;


    uint64 immutable i_subId;

    /// Storage Variables ///
    string private s_mintSourceCode;
    string private s_redeemSourceCode;
    uint256 private s_portfolioBalance;
    bytes32 private s_mostRecentRequestId;
    mapping(bytes32 requestId => dTslaRequest) private s_requestIdToRequest;
    mapping(address users => uint256 pendingWithdrawlAmount) private s_userToWithdrawlAmount;
    uint8 donHostedSecretsSlotID = 0;
    uint64 donHostedSecretsVersion = 1732329024; // TODO should not be hardcoded

    /// Functions ///
    constructor(string memory mintSourceCode, uint64 subId, string memory redeemSourceCode) 
        ConfirmedOwner(msg.sender) 
        FunctionsClient(SEPOLIA_FUNCTIONS_ROUTER) 
        ERC20("dTSLA","dTSLA") 
    {
        s_mintSourceCode = mintSourceCode;
        s_redeemSourceCode = redeemSourceCode;
        i_subId = subId;
    }

    /// Send an htpp request to:
    /// 1. See how much TSLA is bought
    /// 2. If enough TSLA is in the bank account,
    /// mint dStock.
    /// 2 Transactios of type function are used
    function sendMintRequest(uint256 amount) external onlyOwner returns(bytes32){
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(s_mintSourceCode);
        req.addDONHostedSecrets(donHostedSecretsSlotID, donHostedSecretsVersion);
        bytes32 requestId = _sendRequest(req.encodeCBOR(), i_subId, GAS_LIMIT, DON_ID);
        s_mostRecentRequestId = requestId;
        s_requestIdToRequest[requestId] = dTslaRequest(amount, msg.sender, MintOrRedeem.mint);
        return requestId;
    }

    /// Return the amount of TSLA value (in USD) is stored in the bank
    /// If we have enough TSLA token, mint the dTSLA
    function _mintFulfillRequest(bytes32 requestId, bytes memory response) internal {
        uint256 amountOfTokensToMint = s_requestIdToRequest[requestId].amountOfToken;
        s_portfolioBalance = uint256(bytes32(response));

        // if TSLA collateral (how much TSLA we've bought) > dTSLA to mint -> mint
        // How much TSLA in USD do we have?
        // How much TSLA in USD are we minting?
        if(_getCollateralRationAdjustedTotalBalance(amountOfTokensToMint) > s_portfolioBalance) {
            revert dTSLA__NotEnoughCollateral();
        }

        if(amountOfTokensToMint != 0){
            _mint(s_requestIdToRequest[requestId].requester, amountOfTokensToMint );
        }
    }

    /// @notice User sends a request to sell TSLA for USDC (redemptionToken)
    /// This will have the chainlink function call our bank
    /// and do the following:
    /// 1. Sell TSLA stock on the brokerage
    /// 2. Buy USDC on the brokerage
    /// 3. Send USDC to this contract for the user to withdraw
    function sendRedeemRequest(uint256 amountOfTsla) external {
        uint256 amountTslaInUsdc = getUsdcValueOfUsd(getUsdValueofTsla(amountOfTsla));
        if (amountTslaInUsdc < MINIMUM_WITHDRAWAL_AMOUNT){
            revert dTSLA__DoesntMeetMinimumWithdrawalAmount();
        }
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(s_redeemSourceCode);
        
        string[] memory args = new string[](2);
        args[0] = amountOfTsla.toString();
        args[1] = amountTslaInUsdc.toString();
        req.setArgs(args);

        bytes32 requestId = _sendRequest(req.encodeCBOR(), i_subId, GAS_LIMIT, DON_ID);
        s_requestIdToRequest[requestId] = dTslaRequest(amountOfTsla, msg.sender, MintOrRedeem.redeem);

        s_mostRecentRequestId = requestId;
        _burn(msg.sender, amountOfTsla); // in order for user to get the USDC, the TSLA token should be burned
    }

    function _redeemFulfillRequest(bytes32 requestId, bytes memory response) internal {
        // assume for now this has 18 decimals
        uint256 usdcAmount = uint256(bytes32(response));
        if (usdcAmount == 0) {
            uint256 amountOfTslaBurned = s_requestIdToRequest[requestId].amountOfToken;
            _mint(s_requestIdToRequest[requestId].requester, amountOfTslaBurned );
            return;
        }

        s_userToWithdrawlAmount[s_requestIdToRequest[requestId].requester] += usdcAmount;
    }

    function withdraw() external {
        uint256 withdrawlAmount = s_userToWithdrawlAmount[msg.sender];
        s_userToWithdrawlAmount[msg.sender] = 0;
        
        bool succ = ERC20(SEPOLIA_USDC).transfer(msg.sender, withdrawlAmount);
        if (!succ) {
            revert dTSLA__TransferFailed();
        }
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory /*err*/) internal override {
        // if (s_requestIdToRequest[requestId].mintOrRedeem == MintOrRedeem.mint){
        //     _mintFulfillRequest(requestId, response);
        // } else {
        //     _redeemFulfillRequest(requestId, response);
        // }

        // Fullfill request reduced to only update a storage variable to avoid Chainlink function gas errors
        s_portfolioBalance = uint256(bytes32(response));
    }

    function finishMint() external {
        uint amountOfTokensToMint = s_requestIdToRequest[s_mostRecentRequestId].amountOfToken;

        if(_getCollateralRationAdjustedTotalBalance(amountOfTokensToMint) > s_portfolioBalance) {
            revert dTSLA__NotEnoughCollateral();
        }

        if(amountOfTokensToMint != 0){
            s_requestIdToRequest[s_mostRecentRequestId].amountOfToken = 0; // security measure to avoid unauthorized mints
            _mint(s_requestIdToRequest[s_mostRecentRequestId].requester, amountOfTokensToMint );
        }
    }

    function _getCollateralRationAdjustedTotalBalance(uint256 amountOfTokensToMint) internal view returns(uint256) {
        uint256 calculatedNewTotalValue = getCalculatedNewTotalValue(amountOfTokensToMint);
        return (calculatedNewTotalValue * COLLATERAL_RATIO) / COLLATERAL_PRECISION;
    }

    function getCalculatedNewTotalValue(uint256 addedNumberOfTokens) internal view returns (uint256) {
        // 10 dTsla tokens + 5 dTsla tokens = 15 dTsla tokens combined
        return ((totalSupply() + addedNumberOfTokens) * getTslaPrice()) / PRECISION;
    }

    function getTslaPrice() public view returns(uint256){
        AggregatorV3Interface priceFeed = AggregatorV3Interface(SEPOLIA_TSLA_PRICE_FEED);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price) * ADDITIONAL_FEED_PRECISION; // so that we have 18 decimals
    }

    function getUsdcPrice() public view returns(uint256){
        AggregatorV3Interface priceFeed = AggregatorV3Interface(SEPOLIA_USDC_PRICE_FEED);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price) * ADDITIONAL_FEED_PRECISION; // so that we have 18 decimals
    }

    function getUsdcValueOfUsd(uint256 usdAmount) public view returns(uint256) {
        return (usdAmount * getUsdcPrice()) / PRECISION;
    }

    function getUsdValueofTsla(uint256 tslaAmount) public view returns(uint256) {
        return (tslaAmount * getTslaPrice()) / PRECISION;
    }

    /// View and Pure ///
    function getRequest(bytes32 requestId) public view returns (dTslaRequest memory) {
        return s_requestIdToRequest[requestId];
    }

    function getPendingWithdrawlAmount(address user) public view returns (uint256) {
        return s_userToWithdrawlAmount[user];
    }

    function getPortfolioBalance() public view returns (uint256) {
        return s_portfolioBalance;
    }

    function getSubId() public view returns (uint64) {
        return i_subId;
    }

    function getMintSourceCode() public view returns (string memory) {
        return s_mintSourceCode;
    }

    function getRedeemSourceCode() public view returns (string memory) {
        return s_redeemSourceCode;
    }

    function getCollateralRatio() public pure returns (uint256) {
        return COLLATERAL_RATIO;
    }
    
   function getCollateralPrecision() public pure returns (uint256) {
        return COLLATERAL_PRECISION;
    }

}
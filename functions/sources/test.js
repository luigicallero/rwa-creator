// // What does this script do? 
// // 1. Sells TSLA on Alpaca for USD 
// // 2. Buys USDC -> with USD
// // 3. Sends USDC -> contract for withdrawal
import "@chainlink/env-enc";

const ASSET_TICKER = "TSLA";
const CRYPTO_TICKER = "USDCUSD";
// TODO
const RWA_CONTRACT = "0x2a7849fe4caf9ea8e3cbfbc8ec162b0cab39f6ca";
const SLEEP_TIME = 5000; // 5 seconds

async function main() {
    const amountTsla = args[0];
    const amountUsdc = args[1];
    _checkKeys();
    
    console.log(`\nPreferably test it between 10am and 4PM ET\nCurrent Time in ET: ${getEasternTime()}\n`);

    /*//////////////////////////////////////////////////////////////
    SELL TSLA FOR USD
    //////////////////////////////////////////////////////////////*/
    let side = "sell";
    let [clientOrderIdSell, orderStatusSell, responseStatusSell] = await placeOrder(ASSET_TICKER, amountTsla, side);
    if (responseStatusSell !== 200) {
        console.log("it should not enter responseStatus not 200 if with this value: ", responseStatusSell);
        return Functions.encodeUint256(0);
    }
    /*
    Possible Order status (according to Alpaca Documentation)
    accepted: The order has been received by Alpaca, but hasn’t yet been routed 
    to the execution venue. This could be seen often outside of trading session hours.
    pending_new: The order has been received by Alpaca, and routed to the exchanges, 
    but has not yet been accepted for execution. This state only occurs on rare occasions.
    */
    if (orderStatusSell !== "accepted" && orderStatusSell !== "pending_new") {
       console.log("it should enter not accepted order if with this value:", orderStatusSell);
       return Functions.encodeUint256(0);
    }
    
    let filled = await waitForOrderToFill(clientOrderIdSell);
    if (!filled) {
        // @audit, if this fails... That's probably an issue
        await cancelOrder(clientOrderIdSell);
        return Functions.encodeUint256(0);
    }
    
    /*//////////////////////////////////////////////////////////////
    BUY USDC WITH USD
    //////////////////////////////////////////////////////////////*/
    side = "buy";
    console.log(`Now I am going to ${side} ${amountUsdc} USDC`);
    let [clientOrderIdBuy, orderStatusBuy, responseStatusBuy] = await placeOrder(CRYPTO_TICKER, amountUsdc, side);
    console.log(`id: ${clientOrderIdBuy}  Status of Order: ${orderStatusBuy} and response Status is ${responseStatusBuy}`);
    if (responseStatusBuy !== 200) {
        return Functions.encodeUint256(0);
    }
    if (orderStatusBuy !== "accepted" && orderStatusBuy !== "pending_new") {
        console.log("is accessing this if?");
        return Functions.encodeUint256(0);
    }
    filled = await waitForOrderToFill(clientOrderIdBuy);
    if (!filled) {
        // TODO @audit, if this fails... That's probably an issue
        await cancelOrder(clientOrderIdBuy);
        return Functions.encodeUint256(0);
    }

    /*//////////////////////////////////////////////////////////////
                         SEND USDC TO CONTRACT
    //////////////////////////////////////////////////////////////*/
    console.log(`Now I am sending the USDC to my contract`);
    const transferId = await sendUsdcToContract(amountUsdc);
    if (transferId === null) {
        return Functions.encodeUint256(0);
    }

    const completed = await waitForCryptoTransferToComplete(transferId);
    if (!completed) {
        return Functions.encodeUint256(0);
    }
    return Functions.encodeUint256(amountUsdc);
}
    
// returns string: client_order_id, string: orderStatus, int: responseStatus
async function placeOrder(symbol, qty, side) {
    const responseData = await fetch('https://paper-api.alpaca.markets/v2/orders', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'APCA-API-KEY-ID': secrets.alpacaKey,
            'APCA-API-SECRET-KEY': secrets.alpacaSecret
        },
        body: JSON.stringify({
            side: side,
            type: 'market',
            time_in_force: 'gtc',
            symbol: symbol,
            qty: qty
        })
    });
    
    const response = await responseData.json();
    const responseStatus = responseData.status;
    const { id, status: orderStatus } = response;
    
    console.log(`\nChecking Status of Order:\nOrder ID: ${id}\nResponse Status: ${responseStatus}\nOrder Status: ${orderStatus}\n`);
    
    return [id, orderStatus, responseStatus];
}
        
async function cancelOrder(client_order_id) {
    const responseData = await fetch(`https://paper-api.alpaca.markets/v2/orders/${client_order_id}`, {
        method: 'DELETE',
        headers: {
            'accept': 'application/json',
            'APCA-API-KEY-ID': secrets.alpacaKey,
            'APCA-API-SECRET-KEY': secrets.alpacaSecret
        }
    });
    
    const responseStatus = responseData.status;
    console.log(`Order ${client_order_id} has been cancelled with status ${responseStatus}`);
    
    return responseStatus;
}

// @returns bool
async function waitForOrderToFill(client_order_id, currentTime) {
    let numberOfSleeps = 0;
    const capNumberOfSleeps = 10;
    let filled = false;
  
    while (numberOfSleeps < capNumberOfSleeps) {
        const alpacaOrderStatusRequest = await fetch(`https://paper-api.alpaca.markets/v2/orders/${client_order_id}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'APCA-API-KEY-ID': secrets.alpacaKey,
                'APCA-API-SECRET-KEY': secrets.alpacaSecret
            }
        });

        const response = await alpacaOrderStatusRequest.json();
        const responseStatus = alpacaOrderStatusRequest.status;
        
        console.log(`\nChecking Status of Order - Attempt ${numberOfSleeps}\nResponse Status: ${responseStatus}\nOrder Status: ${response.status}`);
        console.log(`\n`);

        const { status: orderStatus } = response;

        if (responseStatus !== 200) {
            return false;
        }
        if (orderStatus === "filled") {
            filled = true;
            break;
        }

        numberOfSleeps++;
        await sleep(SLEEP_TIME);
    }
    return filled;
}

// returns string: transferId
async function sendUsdcToContract(usdcAmount) {
    const transferRequest = Functions.makeHttpRequest({
        method: 'POST',
        url: "https://paper-api.alpaca.markets/v2/wallets/transfers",
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'APCA-API-KEY-ID': secrets.alpacaKey,
            'APCA-API-SECRET-KEY': secrets.alpacaSecret
        },
        data: {
            "amount": usdcAmount,
            "address": RWA_CONTRACT,
            "asset": CRYPTO_TICKER
        }
    });
    
    const [response] = await Promise.all([
        transferRequest,
    ]);
    if (response.status !== 200) {
        return null;
    }
    return response.data.id;
}

async function waitForCryptoTransferToComplete(transferId) {
    let numberOfSleeps = 0;
    const capNumberOfSleeps = 120; // 120 * 5 seconds = 10 minutes
    let completed = false;
    
    while (numberOfSleeps < capNumberOfSleeps) {
        const alpacaTransferStatusRequest = Functions.makeHttpRequest({
            method: 'GET',
            url: `https://paper-api.alpaca.markets/v2/wallets/transfers/${transferId}`,
            headers: {
                'accept': 'application/json',
                'APCA-API-KEY-ID': secrets.alpacaKey,
                'APCA-API-SECRET-KEY': secrets.alpacaSecret
            }
        });
        
        const [response] = await Promise.all([
            alpacaTransferStatusRequest,
        ]);
        
        const responseStatus = response.status;
        // @audit, the transfer could complete, but the response could be 400
        const { status: transferStatus } = response.data;
        if (responseStatus !== 200) {
            return false;
        }
        if (transferStatus === "completed") {
            completed = true;
            break;
        }
        numberOfSleeps++;
        await sleep(SLEEP_TIME);
    }
    return completed;
}

function _checkKeys() {
    if (
        secrets.alpacaKey == "" ||
        secrets.alpacaSecret === ""
    ) {
        throw Error(
            "need alpaca keys"
        );
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Get the current time in Eastern Time (ET)
const getEasternTime = () => {
    const options = {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    
    const easternTime = new Intl.DateTimeFormat('en-US', options).format(new Date());
    return easternTime;
};

const result = await main()
return result
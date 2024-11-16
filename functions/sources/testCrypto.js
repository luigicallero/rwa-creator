/**
 * Tester of Javascript calls to Alpaca paper trading
 * To be executed using "node ./functions/sources/testCrypto.js"
 */

require("@chainlink/env-enc").config

ALPACA_API_KEY = process.env.ALPACA_API_KEY
ALPACA_API_SECRET = process.env.ALPACA_API_SECRET

const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'APCA-API-KEY-ID': ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': ALPACA_API_SECRET
    },
    // body: JSON.stringify({
    //   amount: '1',
    //   address: '0x2a7849fe4caf9ea8e3cbfbc8ec162b0cab39f6ca',
    //   asset: 'USDC'
    // })
  };
  
//   fetch('https://paper-api.alpaca.markets/v2/wallets/transfers', options)
//     .then(res => res.json())
//     .then(res => console.log(res))
//     .catch(err => console.error(err));

// const options = {
//     method: 'GET',
//     headers: {
//       accept: 'application/json',
// 'APCA-API-KEY-ID': ALPACA_API_KEY,
// 'APCA-API-SECRET-KEY': ALPACA_API_SECRET
//     }
//   };

fetch('https://api.alpaca.markets/v2/assets?asset_class=crypto', options)
  .then(res => {
    if (!res.ok) {
      // If status is not OK, log the status and return the raw response as text
      return res.text().then(text => {
        throw new Error(`Request failed with status ${res.status}: ${text}`);
      });
    }
    return res.json();
  })
  .then(data => console.log(data))
  .catch(err => console.error("Error:", err));
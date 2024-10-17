const requestConfig = require("../configs/alpacaMintConfig.js")
const { simulateScript, decodeResult } = require("@chainlink/functions-toolkit")

async function main() {
    const { responseBytesHexstring, errorString, } = await simulateScript(requestConfig) // simulateScript comes with functions-toolkit
    if(responseBytesHexstring) {
        console.log(`Response returned by script: ${decodeResult(
            responseBytesHexstring, requestConfig.expectedReturnType
        ).toString()}\n`)
    }
    if(errorString){
        console.log(`Error returned by script: ${errorString}\n`)
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
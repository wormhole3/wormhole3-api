const { sendMainAsset } = require('./ethers')
const { Matic_Airdrop_Amount } = require('../../config')
const { sleep, sleep2 } = require('./helper')
const log4js = require("log4js");
const { getPendingRecord, setDropped } = require('../db/api/airdrop')
const ethers = require('ethers')

log4js.configure({
    appenders: {
        faucet: {
            type: "dateFile", filename: "logs/faucet.log", pattern: ".yy-MM-dd"
        },
        consoleout: {
            type: "console",
            layout: { type: "colored" }
        }
    },
    categories: {
        default: { appenders: ["faucet", "consoleout"], level: 'debug' }
    }
});

var logger = log4js.getLogger("faucet");

async function pollingFaucet() {
    while(true) {
        try {
            const records = await getPendingRecord();
            if (records.length > 0)
                logger.debug(1, records)
            for (let record of records) {
                const hash = await sendMainAsset(record.eth_address, ethers.utils.parseUnits(Matic_Airdrop_Amount, 18))
                await setDropped(record.twitter_id, hash)
                logger.debug("Send airdrop to:", record.eth_address);
            }
        } catch (error) {
            logger.error('Send airdrop fail:', error)
        }
        await sleep(1);
    }
}

module.exports = {
    pollingFaucet
}
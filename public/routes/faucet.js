const express = require("express");
const router = express.Router();
const { faucet } = require('../src/utils/ethers')
const { getAccountByTwitterId } = require('../src/db/api/user')
const { insertUser, getRecord } = require('../src/db/api/airdrop')
const {
    handleError
} = require('../src/utils/helper')

router.post('/usdt', async (req, res, next) => {
    try{
        const {address} = req.query;
        // const hash = await faucet('USDT', address)
        if (true) 
            return res.status(200).json(hash)
        return handleError(res, e, 'faucet usdt fail')
    }catch (e) {
        return handleError(res, e, 'faucet usdt fail')
    }
})

/**
 * get faucet coin
 * if received coin before, will send Test coin only
 * otherwise will send 0.5 matic, and the matic send will in the server
 */
router.post('/apply', async (req, res, next) => {
    try {
        return res.status(200).json({code: 6})
        const {twitterId} = req.body;
        const user = await getAccountByTwitterId(twitterId);
        if (user) {
            await insertUser(twitterId, user.ethAddress);
            await faucet('USDT', user.ethAddress);
            return res.status(200).json({code: 0})
        }else {
            // user not exist
            return res.status(200).json({code: 6})
        }
    } catch (error) {
        return handleError(res, e, 'add airdrop record fail')
    }
})

router.get('/record', async (req, res, next) => {
    try {
        const record = await getRecord(req.query.twitterId)
        return res.status(200).json(record ?? '')
    } catch (error) {
        return handleError(res, e, 'get record fail')
    }
})

module.exports = router
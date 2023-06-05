var express = require('express');
var router = express.Router();
const { getRegisterOperationByUsername } = require('../src/db/api/register')
const { nftReceiveState, readNft } = require('../src/db/api/nft')
const { getAccountByTwitterId, getAccountByTwitterUsername, getPendingUserByTwitterUsernmae } = require('../src/db/api/user')
const { getUsersTips } = require('../src/db/api/tip')
const { handleError } = require('../src/utils/helper')
const { get } = require('../src/db/redis')
const { ethers } = require('ethers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/byTwitterId', async (req, res) => {
  const { twitterId } = req.query;
  if (twitterId) {
    const user = await getAccountByTwitterId(twitterId)
    return res.status(200).json(JSON.stringify(user || {}))
  }else {
    return handleError(res, "Invalid Twitter Id", 'Parameter missing, need twitter id', 301)
  }
})

/**
 * Get user's account info by username
 * If user send his public key, means he need his new eth account info,
 * If not, check this is a registerd user and return binded info, return twitter id if not a registerd user
 * Return code: 0: not registed 1: match tickets 2:registering 3:match account 4: not send twitter 5: pending user
 */
router.get('/byUsername', async (req, res) => {
  const { username, ethAddress } = req.query;
  if (username) {
    let bindInfo = await getAccountByTwitterUsername(username)
    if (bindInfo) {
      if (bindInfo.isRegistry === 0) {
        bindInfo.isPending = true
      }
      if (bindInfo.isRegistry === 0 && bindInfo.source === 2) {
        // fetch tip assets
        const tips = await getUsersTips(bindInfo.twitterId);
        let steemAmount = 0;
        let sbdAmount = 0;
        if (tips && tips.length > 0) {
          steemAmount = tips.filter(t => t.symbol === 'STEEM' && t.chainName === 'STEEM').reduce((s, t) => s + parseFloat(t.amount ?? 0), 0)
          sbdAmount = tips.filter(t => t.symbol === 'SBD' && t.chainName === 'STEEM').reduce((s, t) => s + parseFloat(t.amount ?? 0), 0)
        }
        return res.status(200).json({code: 3, account: {...bindInfo, steemAmount, sbdAmount}})
      }
      return res.status(200).json({code: 3, account: bindInfo})
    }else {
      // check if in registering process
      if (ethers.utils.isAddress(ethAddress)){
        const op = await getRegisterOperationByUsername(username, ethAddress)
        if (op) {
          return res.status(200).json({code: 2})
        }
        let ticket = await get(ethAddress)
        if (ticket) {
          return res.status(200).json({code: 1})
        }
      }
      return res.status(200).json({code: 0})
    }
  }else {
    return handleError(res, "Invalid Twitter username", "Parameter missing, need twitter username", 302)
  }
})

router.post('/readNft', async (req, res) => {
  const { twitterId } = req.body;
  await readNft(twitterId);
  return res.status(200).json()
})

router.get('/nftReceiveState', async (req, res) => {
  const { twitterId } = req.query;
  const readed  = await nftReceiveState(twitterId)
  if (readed) {
    return res.status(200).json(readed)
  }else {
    return res.status(200).json()
  }
})

module.exports = router;

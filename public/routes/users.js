var express = require('express');
var router = express.Router();
const { getRegisterOperationByUsername } = require('../src/db/api/register')
const { nftReceiveState, readNft } = require('../src/db/api/nft')
const { getAccountByTwitterId, getAccountByTwitterIds, getAccountByTwitterUsername, 
  searchUsers, getAccountByEthAddress, getUserVPRC } = require('../src/db/api/user')
const { getVP } = require('../src/utils/votingPower')
const { addNewAccountsWhoNotRegisterNow } = require('../src/db/api/register')
const { getUsersTips } = require('../src/db/api/tip')
const { getCurationRewardList, getCurationRewardListHistory, getAutoCurationRewardList, getAutoCurationAuthorRewardList } = require('../src/db/api/curation_record')
const { handleError, sleep } = require('../src/utils/helper')
const { get, del, set } = require('../src/db/redis')
const { ethers } = require('ethers')
const { AuthErrCode, UserAuthKeyPre, REDIS_REGISTERING_PRE, ERR_CODE } = require('../config')
const { checkTwitterAuth, checkEthSignature } = require('../src/utils/validator');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/login', async (req, res) => {
  const { state } = req.query;
  if (!state) {
    return handleError(res, 'Wrong auth', 'Wrong auth', AuthErrCode.InvalidCode)
  }
  const stateV = await get(state);
  if (!stateV) {
    return handleError(res, 'Wrong auth', 'Wrong auth', AuthErrCode.InvalidCode)
  }
  if (parseInt(stateV) === 1) {
    // waiting
    return res.status(200).json({code: 1});
  }
  if (stateV === 'needLogin') {
    // waiting
    return res.status(200).json({code: 1});
  }
  let loginInfo = await get(state);
  if (loginInfo) {
    loginInfo = JSON.parse(loginInfo);
    const twitterId = loginInfo.twitterId;
    let bindInfo = await getAccountByTwitterId(twitterId)
    if (bindInfo && bindInfo.isRegistry === 1) {
      bindInfo.accessToken = loginInfo.access_token;
      bindInfo.expiresAt = loginInfo.expires_at;
      // del state after 10 sec
      await set(state, JSON.stringify(loginInfo), 10);
      return res.status(200).json({code: 3, account: bindInfo})
    }else{
      // if registering, setted when user call the sign up api, removed when register ok or fail
      const isRegistring = await get(REDIS_REGISTERING_PRE + loginInfo.twitterId);
      if (parseInt(isRegistring) === 1){
        // waiting for a minite
        let count = 0;
        while(count < 30) {
          let bindInfo = await getAccountByTwitterId(twitterId);
          if (bindInfo && bindInfo.isRegistry === 1) {
            bindInfo.accessToken = loginInfo.access_token;
            bindInfo.expiresAt = loginInfo.expires_at;
            return res.status(200).json({code: 3, account: bindInfo})
          }
          count++;
          await sleep(2);
        }
        // out of time
        return handleError(res, 'Register out of time', 'Register out of time', AuthErrCode.RegisterOutTime);
      }else {
        // not register add new user
        if (!bindInfo) {
          let account = {
              twitterId,
              twitterName: loginInfo.name,
              twitterUsername: loginInfo.username,
              profileImg: loginInfo.profileImg,
              source: 1,
              verified: loginInfo.verified,
              followers: loginInfo.followers_count,
              following: loginInfo.following_count
          }
          await addNewAccountsWhoNotRegisterNow([account]);
        }
        return res.status(200).json({code: 0, account: {accessToken: loginInfo.access_token, twitterId: loginInfo.twitterId, twitterName: loginInfo.name, twitterUsername: loginInfo.username, profileImg: loginInfo.profileImg}})
      }
    }
  }else{
    return handleError(res, 'Wrong auth', 'Wrong auth', AuthErrCode.InvalidCode)
  }
})

router.get('/byTwitterId', async (req, res) => {
  const { twitterId } = req.query;
  if (twitterId) {
    const user = await getAccountByTwitterId(twitterId)
    return res.status(200).json(JSON.stringify(user || {}))
  }else {
    return handleError(res, "Invalid Twitter Id", 'Parameter missing, need twitter id', 301)
  }
})

router.get('/byTwitterIds', async (req, res) => {
  const { twitterIds } = req.query;
  if (!twitterIds || twitterIds.length === 0) {
    return res.status(200).json({})
  }
  const users = await getAccountByTwitterIds(twitterIds);
  return res.status(200).json(users)
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
      return res.status(200).json({code: 0})
    }
  }else {
    return handleError(res, "Invalid Twitter username", "Parameter missing, need twitter username", 302)
  }
})

/**
 * update user's profile
 */
router.post('/profile', checkTwitterAuth, async (req, res) => {
  const { twitterId } = req.body;
  if (twitterId) {
    let token = await get(UserAuthKeyPre + twitterId);
    token = JSON.parse(token);
    let bindInfo = await getAccountByTwitterId(twitterId);
    if (bindInfo) {
      if (bindInfo.isRegistry === 1) {
        bindInfo.accessToken = token.access_token;
        bindInfo.expiresAt = token.expires_at; 
        return res.status(200).json({code: 3, account: bindInfo})
      }
    }
    return res.status(200).json({code: 0})
  }else{
    return handleError(res, "Invalid Twitter username", "Parameter missing, need twitter username", 302)
  }
})

router.get('/getUserByEth', async (req, res) => {
  const { ethAddress } = req.query;
  try {
    if (ethers.utils.isAddress(ethAddress)) {
      const user = await getAccountByEthAddress(ethAddress);
      if (user) {
        return res.status(200).json({code: 3, account: user});
      }else {
        return res.status(200).json({code: 0});
      }
    }else {
      return res.status(200).json({code: 0});
    }
  }catch (e) {
    console.log('Get user by eth error:', e);
    return handleError(res, 'Server error', 'Server error', 503)
  }
})

router.get('/getUserVP', async (req, res) => {
  const { twitterId } = req.query;
  try {
    const vp = await getVP(twitterId);
    return res.status(200).json(vp);
  } catch (e) {
    console.log('Get user vp fail:', e);
    return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR);
  }
})

router.get('/getUserVPRC', async (req, res) => {
  const { twitterId } = req.query;
  try {
    const userInfo = await getUserVPRC(twitterId)
    return res.status(200).json(userInfo);
  } catch (e) {
    console.log('Get user vp and rc fail:', e);
    return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR);
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

router.get('/searchUsers', async (req, res) => {
  const { text } = req.query;
  if (!text || text === '') return handleError(res, 'Null params', 'Null param', ERR_CODE.PARAMS_ERROR)
  try {
    const users = await searchUsers(text);
    return res.status(200).json(users)
  }catch(e) {
    return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR); 
  }
})

/****************************************  rewards  ***********************************************/
router.get('/postValue', checkTwitterAuth, async  (req, res) => {
  const { twitterId } = req.query;
  
})

/**
 * Unclaimed promotion rewards of user
 */
router.post('/curationRewardList', async (req, res) => {
  const { twitterId, chainId, createAt } = req.body;
  try {
    const records = await getCurationRewardList(twitterId, chainId, createAt);
    return res.status(200).json(records);
  } catch (e) {
    console.log("get curation rewards list fail:", e);
    return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR);
  }
})

/**
 * All promotion reward of user
 */
router.post('/curationRewardListHistory', async (req, res) => {
  const { twitterId, chainId, createAt } = req.body;
  try {
    const records = await getCurationRewardListHistory(twitterId, chainId, createAt);
    return res.status(200).json(records);
  } catch (e) {
    console.log("get curation rewards list fail:", e);
    return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR);
  }
})

// for deshool
router.post('/curationRewardListFByEth', checkEthSignature, async (req, res) => {
  const { ethAddress, chainId } = req.body;
  try {
    const user = await getAccountByEthAddress(ethAddress);
    const twitterId = user.twitterId;
    if (!twitterId) {
      return handleError(res, "AccessToken Invalid", "AccessToken Invalid", AuthErrCode.InvalidAccessToken)
    }
    const records = await getCurationRewardList(twitterId, chainId);
    return res.status(200).json(records);
  }catch(e) {
    console.log("get curation rewards list fail:", e);
    return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR);
  }
})

/**
 * All promotion reward of user
 */
router.post('/curationRewardListHistoryByEth', checkEthSignature, async (req, res) => {
  const { ethAddress, chainId, createAt } = req.body;
  try {
    const user = await getAccountByEthAddress(ethAddress);
    const twitterId = user.twitterId;
    if (!twitterId) {
      return handleError(res, "AccessToken Invalid", "AccessToken Invalid", AuthErrCode.InvalidAccessToken)
    }
    const records = await getCurationRewardListHistory(twitterId, chainId, createAt);
    return res.status(200).json(records);
  } catch (e) {
    console.log("get curation rewards list fail:", e);
    return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR);
  }
})

router.post('/autoCurationRewardList', async (req, res) => {
  const { twitterId, createAt } = req.body;
  try {
    const records = await getAutoCurationRewardList(twitterId, createAt);
    return res.status(200).json(records);
  } catch (e) {
    console.log("get auto curation rewards list fail:", e);
    return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR);
  }
})

router.post('/autoCurationAuthorRewardList', async (req, res) => {
  const { twitterId, createAt } = req.body;
  try {
    const records = await getAutoCurationAuthorRewardList(twitterId, createAt);
    return res.status(200).json(records);
  } catch (e) {
    console.log("get auto curation author rewards list fail:", e);
    return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR);
  }
})

module.exports = router;

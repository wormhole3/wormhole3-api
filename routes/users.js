var express = require('express');
var router = express.Router();
const UserDB = require('../src/db/api/user')
const { handleError } = require('../src/utils/helper')
const { ERR_CODE } = require('../config')
const { get, del, set } = require('../src/db/redis')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/byNonce', async (req, res) => {
  const { nonce } = req.query;
  if (nonce) {
    const record = await UserDB.getTwitterAuthRecordByNonce(nonce);
    if (record) {
      return res.status(200).json(record);
    }else{
      return handleError(res, "User not exist", 'User not exist', ERR_CODE.USER_NOT_EXIST);
    }
  }else {
    return handleError(res, "Invalid nonce", 'Parameter missing, need nonce', 301)
  }
})

router.get('/byTwitterId', async (req, res) => {
  const { twitterId } = req.query;
  if (twitterId) {
    const user = await UserDB.getAccountByTwitterId(twitterId);
    if (user) {
      return res.status(200).json(user)
    } else {
      return handleError(res, "User not exist", 'User not exist', ERR_CODE.USER_NOT_EXIST);
    }
  }else {
    return handleError(res, "Invalid Twitter Id", 'Parameter missing, need twitter id', 301)
  }
})


router.get('/byUsername', async (req, res) => {
  const { username } = req.query;
  if (username) {
    const user = await UserDB.getAccountByTwitterUsername(username);
    if (user) {
      return res.status(200).json(user)
    } else {
      return handleError(res, "User not exist", 'User not exist', ERR_CODE.USER_NOT_EXIST);
    }
  }else {
    return handleError(res, "Invalid Twitter username", "Parameter missing, need twitter username", 302)
  }
})

router.get('/byNearId', async (req, res) => {
  const { nearId } = req.query;
  if (nearId) {
    const user = await UserDB.getAccountByNearId(nearId);
    if (user) {
      return res.status(200).json(user)
    } else {
      return handleError(res, "User not exist", 'User not exist', ERR_CODE.USER_NOT_EXIST);
    }
  }else {
    return handleError(res, "Invalid near id", "Parameter missing, need near id", 302)
  }
})



module.exports = router;

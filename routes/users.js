var express = require('express');
var router = express.Router();
const UserDB = require('../src/db/api/user')
const { handleError } = require('../src/utils/helper')
const { get, del, set } = require('../src/db/redis')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/byTwitterId', async (req, res) => {
  const { twitterId } = req.query;
  if (twitterId) {
    const user = await UserDB.getAccountByTwitterId(twitterId);
    return res.status(200).json(JSON.stringify(user || {}))
  }else {
    return handleError(res, "Invalid Twitter Id", 'Parameter missing, need twitter id', 301)
  }
})


router.get('/byUsername', async (req, res) => {
  const { username } = req.query;
  if (username) {
    const user = await UserDB.getAccountByTwitterUsername(username);
    return res.status(200).json(JSON.stringify(user || {}))
  }else {
    return handleError(res, "Invalid Twitter username", "Parameter missing, need twitter username", 302)
  }
})

router.get('/byNearId', async (req, res) => {
  const { nearId } = req.query;
  if (nearId) {
    const user = await UserDB.getAccountByNearId(nearId);
    return res.status(200).json(JSON.stringify(user || {}))
  }else {
    return handleError(res, "Invalid near id", "Parameter missing, need near id", 302)
  }
})

router.get('/searchUsers', async (req, res) => {
    return res.status(200).json({});
})

module.exports = router;

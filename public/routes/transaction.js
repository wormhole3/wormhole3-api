var express = require('express');
var router = express.Router();
const { getUsersTransactionRefresh, getMoreUsersTransaction } = require('../src/db/api/send')
const { getUsersTipsRefresh, getMoreUsersTips } = require('../src/db/api/tip') 
const { handleError } = require('../src/utils/helper')

/**
 * Get user's account info by twitterId
 * If user send his public key, means he need his new eth account info,
 * If not, check this is a registerd user and return binded info, return twitter id if not a registerd user
 */
router.get('/byTwitterId', async (req, res) => {
  let { twitterId, pageSize, time, newTrans } = req.query;
  pageSize = pageSize ?? 30;
  try{
        if (newTrans === 'true') {
            const trans = await getUsersTransactionRefresh(twitterId, pageSize, time)
            return res.status(200).json(trans)
        }else {
            const trans = await getMoreUsersTransaction(twitterId, pageSize, time)
            return res.status(200).json(trans)
        }
    }catch(e) {
        console.log("Get user's transaction fail:", e);
        return handleError(res, 'DB fail', 'Search data from db fail', 500)
    }
})

router.get('/tipsByTwitterId', async (req, res) => {
  let { twitterId, pageSize, time, newTips } = req.query;
  pageSize = pageSize ?? 30;
  try{
        if (newTips === 'true') {
            const trans = await getUsersTipsRefresh(twitterId, pageSize, time)
            return res.status(200).json(trans)
        }else {
            const trans = await getMoreUsersTips(twitterId, pageSize, time)
            return res.status(200).json(trans)
        }
    }catch(e) {
        console.log("Get user's transaction fail:", e);
        return handleError(res, 'DB fail', 'Search data from db fail', 500)
    }
})

module.exports = router;

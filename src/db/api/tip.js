const { execute } = require("../pool");

/**
 * Record the posts that used to tip token.
 * @param {Object} post register post object:
 */
async function recordTipPosts(post) {
  let sql = 'INSERT INTO post_tip (`tweet_id`,`twitter_id`,`twitter_username`, `steem_id`, `content`,`post_time`,`target_twitter_id`,`target_username`, `target_address`, `amount`,`chain_name`,`symbol`, `memo`, `transfer_direct`) VALUE (?,?,?,?,?,?,?,?,?,?,?,?,?,?);';
  let res;
  try {
    res = await execute(sql, [post.tweetId, post.twitterId, post.twitterUsername, post.steemId, post.content, post.postTime, post.targetTwitterId, post.targetUsername, post.targetAddress, post.amount, post.chainName, post.symbol, post.memo, post.transferDirect]);
  } catch (error) {
    if ("ER_DUP_ENTRY" == error?.code) {
      console.warn(`Duplicate entry ${post.postId} for key post_id.`);
    } else {
      console.error('Store ', error);
    }
  }
  if (!res) {
    return 0;
  }
  return res.affectedRows
}

/**
 * Get the posts that haven't been tip yet.
 * tip record need to send users asset to wormhole3 official account
 * @param {Number} limit The number of post returned.
 * @returns The record that haven't been tip yet.
 */
async function getNotTipPosts(limit) {
  let size = limit || 1000;
  let sql =
    `SELECT
      p.id,
      p.twitter_id as twitterId,
      s.steem_id as fromSteem,
      p.target_address as targetAddress,
      p.target_twitter_id as targetTwitterId,
      p.chain_name as chainName,
      p.symbol,
      p.memo,
      p.amount,
      p.tip_status as tipStatus,
      p.transfer_direct as transferDirect
    FROM
      post_tip as p
    JOIN twitter_steem_mapping as s on p.twitter_id = s.twitter_id
    WHERE
      (p.tip_status = 0 OR p.tip_status = 2)
      AND s.is_del = 0
      LIMIT ?`;

  const res = await execute(sql, [size]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Update the status of the post that used to tip money.
 * @param {String} id operation id.
 * @param {Number} status 0: not tip 1: success 2: fail 3:retry fail 4:canceld
 * @param {Number} result 0, insufficent balance: 1, insufficent gas: 2， fail: 3.target user not exist:4
 */
async function updateTipPostStatus(id, status, result, hash) {
  let sql =
    `UPDATE post_tip
      SET tip_status = ?, tip_result = ?, trans_hash = ?
      WHERE
        id = ?`;
  const res = await execute(sql, [status, result, hash, id]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * get users tips amount
 * only get the recored that transfer success and not returned
 * @param {*} twitterId the twitter who received tips
 */
async function getUsersTips(twitterId) {
  let sql = `SELECT id, target_twitter_id as targetTwitterId, amount, chain_name as chainName, symbol
  FROM post_tip WHERE target_twitter_id = '${twitterId}' AND return_status=0 AND transfer_direct=0 AND tip_status=1`;
  const res = await execute(sql);
  if (!res || res.length === 0) {
    return []
  }
  return res
}

/**
 * have transfer tips to the new user
 * update the status
 * @param {*} id 
 * @param {*} hash
 */
async function setPendingRecordRegistered(id, twitterId, isRegisted, steemAmount, sbdAmount, hash, status) {
  let sql = `UPDATE pending_registry SET is_registed=?, received_steem=?, received_sbd=?, trans_hash=?, trans_status=?
  WHERE id=?;`;
  if (twitterId) {
    sql += `
    UPDATE post_tip SET return_status=2 WHERE twitter_id='${twitterId}'`
  }
  await execute(sql, [isRegisted, steemAmount, sbdAmount, hash, status, id]);
}

/**
 * get the tip record which need to return to the user
 * @param {Number} limit 
 * @param {Number} date 
 * @returns 
 */
async function getExpiredTips(limit, date) {
  let sql = `SELECT id, steem_id as steemId, amount, chain_name as chainName, symbol, target_username as targetUsername FROM post_tip WHERE return_status = 0 AND create_time < DATE_SUB(CURDATE(),INTERVAL ${date} DAY) LIMIT ${limit}`;
  const res = await execute(sql);
  if (!res || res.length === 0) {
    return []
  }
  return res
}

/**
 * Update return status when return asset to original user success
 * @param {*} id 
 * @param {*} hash 
 */
async function updateReturnStatus(id, hash) {
  let sql = `UPDATE post_tip SET return_status=1, return_hash=? WHERE id=?`;
  await execute(sql, [hash, id])
}


/**
 * Get user's new tips
 * @param {*} twitterId 
 * @param {*} limit 
 * @param {*} time 
 */
 async function getUsersTipsRefresh(twitterId, limit, time) {
  let sql = `SELECT 
        post_time AS postTime,
        twitter_id as twitterId,
        twitter_username as username,
        content,
        amount,
        tip_status AS tipStatus,
        chain_name AS chainName,
        symbol,
        target_address AS targetAddress,
        tip_result AS tipResult,
        trans_hash AS hash,
        target_username AS targetUsername,
        target_twitter_id as targetTwitterId,
        return_status as returnStatus,
        transfer_direct as transferDirect
      FROM post_tip
      WHERE
        twitter_id = ? OR target_twitter_id = ?
  `
  if (time) {
    sql += `AND post_time > ?
    ORDER BY post_time ASC
    LIMIT ?`
    const res = await execute(sql, [twitterId, twitterId, time, parseInt(limit)])
    if (!res || res.length === 0) {
      return []
    }
    return res.reverse()
  } else {
    sql += `ORDER BY post_time DESC
  LIMIT ?`
    const res = await execute(sql, [twitterId, twitterId, parseInt(limit)])
    if (!res || res.length === 0) {
      return []
    }
    return res
  }
}

/**
 * Get more user's tips
 * @param {*} twitterId 
 * @param {*} limit 
 * @param {*} time 
 * @returns 
 */
async function getMoreUsersTips(twitterId, limit, time) {
  let sql = `SELECT 
      post_time AS postTime,
      twitter_id as twitterId,
      twitter_username as username,
      content,
      amount,
      tip_status AS tipStatus,
      chain_name AS chainName,
      symbol,
      target_address AS targetAddress,
      tip_result AS tipResult,
      trans_hash AS hash,
      target_username AS targetUsername,
      target_twitter_id as targetTwitterId,
      return_status as returnStatus,
      transfer_direct as transferDirect
      FROM post_tip
    WHERE
      (twitter_id = ? OR target_twitter_id = ?)
      AND post_time < ?
    ORDER BY post_time DESC
    LIMIT ?
  `
  const res = await execute(sql, [twitterId, twitterId, time, parseInt(limit)])
  if (!res || res.length === 0) {
    return []
  }
  return res
}

module.exports = {
    recordTipPosts,
    getNotTipPosts,
    updateTipPostStatus,
    getUsersTips,
    setPendingRecordRegistered,
    getExpiredTips,
    updateReturnStatus,
    getUsersTipsRefresh,
    getMoreUsersTips
}
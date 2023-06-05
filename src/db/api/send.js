const {
  execute
} = require("../pool");

/**
 * Record the posts that used to transfer money.
 * @param {Object} post register post object:
 * {
 * postId,
 * twitterId,
 * twitterName,
 * twitterUsername,
 * content,
 * postTime,
 * targetId,
 * amount,
 * chainName,
 * asset,
 * targetAddress,
 * contract
 * }.
 */
async function recordSendPosts(post) {
  let sql = 'INSERT INTO post_send (`post_id`,`twitter_id`,`name`,`username`,`content`,`post_time`,`target_id`,`amount`,`chain_name`,`asset`,`target_address`,`contract`, `target_username`, `memo`) VALUE (?,?,?,?,?,?,?,?,?,?,?,?,?,?);';
  let res;
  try {
    res = await execute(sql, [post.postId, post.twitterId, post.twitterName, post.twitterUsername, post.content, post.postTime, post.targetId, post.amount, post.chainName, post.asset, post.targetAddress, post.contract, post.targetUsername, post.memo]);
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
 * Get the posts that haven't been sent yet.
 * Include every asset transfer
 * @param {Number} limit The number of post returned.
 * @returns The posts that haven't been sent yet.
 * [{
 *  id: the primary key of the post_send table,
 *  steemId: the steem account id of the twitter author,
 *  amount: the amount of the transfer.
 * }]
 */
async function getNotSentPosts(limit) {
  let size = limit || 1000;
  let sql =
    `SELECT
      p.id,
      p.twitter_id AS twitterId,
      p.target_id AS targetId,
      p.amount,
      p.chain_name AS chainName,
      p.asset,
      p.contract,
      p.target_address AS targetAddress,
      p.send_status AS sendStatus,
      p.memo,
      s.steem_id AS fromSteem,
      s.web25Private
    FROM
      post_send as p
    LEFT JOIN twitter_steem_mapping as s on p.twitter_id = s.twitter_id AND s.is_del = 0
    WHERE
      ( p.send_status = 0 OR p.send_status = 2 )
      AND p.is_del = 0
      LIMIT ?`;

  const res = await execute(sql, [size]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Update the status of the post that used to transfer money.
 * @param {String} id operation id.
 * @param {Number} status not sent: 0, sent: 1, fail: 2, retry-fail: 3， canceled: 4.
 * @param {Number} result  0:success，1.insuffient fund，2。insufficient gas，3.trans fail，4.target user not exist
 */
async function updateSendPostStatus(id, status, result, hash) {
  let sql =
    `UPDATE post_send
      SET send_status = ?, send_result = ?, transaction_hash = ?
      WHERE
        id = ?
        AND is_del = 0`;
  const res = await execute(sql, [status, result, hash, id]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Get user's new transactions
 * @param {*} twitterId 
 * @param {*} limit 
 * @param {*} time 
 * @returns 
 */
async function getUsersTransactionRefresh(twitterId, limit, time) {
  let sql = `SELECT 
    post_time AS postTime,
    twitter_id as twitterId,
    username,
    content,
    amount,
    send_status AS sendStatus,
    chain_name AS chainName,
    asset,
    contract,
    target_address AS targetAddress,
    send_result AS sendResult,
    transaction_hash AS hash,
    target_username AS targetUsername
    FROM post_send
    WHERE
      (twitter_id = ? OR target_id = ?)
      AND is_del = 0
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
 * Get more user's transactions
 * @param {*} twitterId 
 * @param {*} limit 
 * @param {*} time 
 * @returns 
 */
async function getMoreUsersTransaction(twitterId, limit, time) {
  let sql = `SELECT 
    post_time AS postTime,
    twitter_id as twitterId,
    username,
    content,
    amount,
    send_status AS sendStatus,
    chain_name AS chainName,
    asset,
    contract,
    target_address AS targetAddress,
    send_result AS sendResult,
    transaction_hash AS hash,
    target_username AS targetUsername
    FROM post_send
    WHERE
      (twitter_id = ? OR target_id = ?)
      AND is_del = 0
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
  recordSendPosts,
  getNotSentPosts,
  updateSendPostStatus,
  getUsersTransactionRefresh,
  getMoreUsersTransaction
};
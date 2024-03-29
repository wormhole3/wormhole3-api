const { execute } = require("../pool");

async function registerNewAccount(twitterId, twitterUsername, twitterName, profileImg, nearId, nonce) {
  let sql = `INSERT INTO twitter_auth_record (twitter_id,twitter_username,twitter_name, profile_img, near_id,nonce) VALUES(?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE twitter_username=?, twitter_name=?, profile_img=?, near_id=?, nonce=?, status=IF(status=2,2,1);`;
  const res = await execute(sql, [twitterId, twitterUsername, twitterName, profileImg, nearId, nonce, twitterUsername, twitterName, profileImg, nearId, nonce]);
  if (!res) {
      return 0;
  }
  return res.affectedRows
}

async function getTwitterAuthRecordByNonce(nonce) {
  let sql = `SELECT twitter_id as twitterId, twitter_username as twitterUsername, twitter_name as twitterName, profile_img as profileImg, near_id as nearId, status FROM twitter_auth_record WHERE nonce=?`;
  const res = await execute(sql, [nonce]);
  if (res && res.length > 0) {
    return res[0]
  }
  return;
}

/**
 * Get bind account by twitter account.
 * Use for checking whether the twitter account has been created a steem account.
 * @param {String} twitterId twitter user id.
 */
async function getAccountByTwitterId(twitterId) {
  let sql =
    `SELECT twitter_id as twitterId, near_id as nearId, twitter_username as twitterUsername , twitter_username as twitterUsername, twitter_name as twitterName, profile_img as profileImg
    FROM user_info 
    WHERE twitter_id = ? AND is_del=0;`;
  const res = await execute(sql, [twitterId]);
  if (!res || res.length === 0) {
    return null
  }
  return res[0]
}

async function getAccountByTwitterUsername(username) {
  let sql =
    `SELECT twitter_id as twitterId, near_id as nearId, twitter_username as twitterUsername , twitter_username as twitterUsername, twitter_name as twitterName, profile_img as profileImg
    FROM user_info 
    WHERE twitter_username = ? AND is_del=0;`;
  const res = await execute(sql, [username]);
  if (!res || res.length === 0) {
    return null
  }
  return res[0]
}

async function getAccountByNearId(nearId) {
  let sql =
    `SELECT twitter_id as twitterId, near_id as nearId, twitter_username as twitterUsername , twitter_username as twitterUsername, twitter_name as twitterName, profile_img as profileImg
    FROM user_info 
    WHERE near_id = ? AND is_del=0;`;
  const res = await execute(sql, [nearId]);
  if (!res || res.length === 0) {
    return null
  }
  return res[0]
}

module.exports = {
  registerNewAccount,
  getAccountByTwitterId,
  getAccountByTwitterUsername,
  getAccountByNearId,
  getTwitterAuthRecordByNonce
};

const { execute } = require("../pool");

/**
 * Get bind account by twitter account.
 * Use for checking whether the twitter account has been created a steem account.
 * @param {String} twitterId twitter user id.
 */
async function getAccountByTwitterId(twitterId) {
  let sql =
    `SELECT
      m.twitter_id AS twitterId,
      m.twitter_name AS twitterName,
      m.twitter_username AS twitterUsername,
      m.steem_id AS steemId,
      m.eth_address AS ethAddress,
      m.web25ETH,
      m.profile_img AS profileImg,
      r.public_key AS publicKey,
      m.reputation,
      m.has_received_nft as hasReceivedNft,
      m.has_minted_rp as hasMintedRP,
      m.bind_steem as bindSteem,
      m.is_registry as isRegistry,
      m.source as source
    FROM
      twitter_steem_mapping AS m,
      post_register AS r
    WHERE
      m.twitter_id = ?
      AND m.is_del = 0
      AND r.is_del = 0
      AND r.post_id = m.post_id`;
  const res = await execute(sql, [twitterId]);
  if (!res || res.length === 0) {
    return null
  }
  return res[0]
}

async function getAccountByTwitterUsername(username) {
  let sql =
    `SELECT
      m.twitter_id AS twitterId,
      m.twitter_name AS twitterName,
      m.twitter_username AS twitterUsername,
      m.steem_id AS steemId,
      m.eth_address AS ethAddress,
      m.web25ETH,
      m.profile_img AS profileImg,
      m.reputation,
      m.has_received_nft as hasReceivedNft,
      m.has_minted_rp as hasMintedRP,
      m.bind_steem as bindSteem,
      m.is_registry as isRegistry,
      m.source as source
    FROM
      twitter_steem_mapping AS m
    WHERE
      m.twitter_username = ?
      AND m.is_del = 0`;
  const res = await execute(sql, [username]);
  if (!res || res.length === 0) {
    return null
  }
  return res[0]
}

async function getPendingUserByTwitterUsernmae(username) {
  let sql = `SELECT twitter_id as twitterId, username as twitterUsername, profile_img as profileImg, is_registed as isRegisted FROM pending_registry WHERE username='${username}'`;
  const res = await execute(sql);
  if (!res || res.length === 0) {
    return null
  }
  return res[0]
}

async function updateTwitterUsername(user) {
  let sql = `UPDATE twitter_steem_mapping SET twitter_username=?, twitter_name=? WHERE twitter_id=?`;
  await execute(sql, [user.username, user.name, user.id]);
}

module.exports = {
  getAccountByTwitterId,
  getAccountByTwitterUsername,
  updateTwitterUsername,
  getPendingUserByTwitterUsernmae
};

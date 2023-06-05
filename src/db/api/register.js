const { execute } = require("../pool");
const { b64uEnc, b64uDec, hexToString } = require("../../utils/helper")
const { getKey, set, get, del } = require("../redis");
/**
 * Record the posts that used to register.
 * @param {Object} post register post object:{postId,twitterId,twitterName,twitterUsername,content,publicKey,postTime}.
 */
async function recordRegisterPosts(post) {
  let sql = 'INSERT INTO post_register (`post_id`,`twitter_id`,`name`,`username`,`content`,`public_key`,`post_time`) VALUE (?,?,?,?,?,?,?);';
  let res;
  try {
    res = await execute(sql, [post.postId, post.twitterId, post.twitterName, post.twitterUsername, post.content, post.publicKey, post.postTime]);
  } catch (error) {
    if ("ER_DUP_ENTRY" == error?.code) {
      console.warn(`Duplicate entry ${post.postId} for key post_id.`);
    }
  }
  if (!res) {
    return 0;
  }
  return res.affectedRows;
}

/**
 * Get the unregistered posts.
 * @param {Number} limit The number of post returned.
 * @returns The unregistered post list.
 */
async function getUnregisteredPosts(limit) {
  let size = limit || 1000;
  let sql =
    `SELECT
        id,
        post_id AS postId,
        twitter_id AS twitterId,
        twitter_name AS twitterName,
        twitter_username AS twitterUsername,
        register_status AS registerStatus,
        public_key AS publicKey,
        profile_img AS profileImg,
        verified,
        followers,
        following
      FROM
        post_register
      WHERE
        ( register_status = 0 OR register_status = 2 )
        AND is_del = 0
        LIMIT ?`;

  const res = await execute(sql, [size]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Get the accounts those not synced to blockchain
 * @returns 
 */
async function getUnsyncedAccount() {
  let sql = `
    SELECT
      twitter_id AS twitterId,
      steem_id AS steemId,
      eth_address AS web3Id,
      web25ETH AS web25Id
    FROM twitter_steem_mapping
    WHERE
      is_del = 0
      AND is_to_blockchain = 0
    LIMIT 10
  `
  const res = await execute(sql);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * set account on blockchain flag to true
 * @param {*} twitterIds 
 * @returns 
 */
async function setAccountsOnChain(twitterIds) {
  let sql = '';

  twitterIds.map(id => sql += `UPDATE twitter_steem_mapping
  SET is_to_blockchain = 1
  WHERE
    twitter_id ="${id}";
    `)
  const res = await execute(sql);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Receive a new register operation twitter, fill into db
 * @param {*} operation
 */
async function newRegisterOperation(operation) {
  let res;
  try {
    let sql = `
      INSERT INTO post_register (post_id,twitter_id,twitter_name,twitter_username,content,public_key,profile_img,post_time,followers,following,tweet_count,listed_count,verified)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?);`
    res = await execute(sql, [
      operation.postId,
      operation.twitterId,
      operation.twitterName,
      operation.twitterUsername,
      operation.content,
      operation.publicKey,
      operation.profileImg,
      new Date(),
      operation.followers,
      operation.following,
      operation.tweetCount,
      operation.listedCount,
      operation.verified
    ]);
  } catch (e) {
    console.log(235, e);
  }
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Update the status of the post that used to register.
 * @param {String} id operation id.
 * @param {Number} status unregistered: 0, registered: 1, fail: 2, retry-fail: 3， canceled: 4.
 */
async function updateRegisterPostStatus(id, status) {
  let sql =
    `UPDATE post_register
      SET register_status = ?
      WHERE
        id = ?
        AND is_del = 0`;
  const res = await execute(sql, [status, id]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * generate a new steem and eth account to the specific twitter account
 * first distinguish the duplicated record from a single user
 * need to create a new account bind record
 * @param {Object} account {twitterId, steemId, twitterName, twitterUsername, postId, postKey, ethAddress, encryptedKey, registerTime}.
 * encryptedKey: encrypted key by user's public key and our private key, need to store in operate table
 */
async function registerNewAccount(account) {
  let sql = 'INSERT INTO twitter_steem_mapping (`twitter_id`,`steem_id`,`twitter_name`,`twitter_username`,`post_id`,`post_key`,`eth_address`,`encrypted_key`,`register_time`,`web25ETH`, `web25Private`, `profile_img`, `reputation`, `has_reputation`, `bind_steem`) VALUE(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  const res = await execute(sql, [account.twitterId, account.steemId, account.twitterName, account.twitterUsername, account.postId, account.postKey, account.ethAddress, account.encryptedKey, account.registerTime, account.web25ETH, b64uEnc(account.web25Private), account.profileImg, -1, 0, account.bindSteem]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * update users reputation
 * @param {*} account 
 * @returns 
 */
async function updateUserReputation(account) {
  const rep = parseInt(account.reputation ?? -1)
  let sql = `UPDATE twitter_steem_mapping SET reputation=${rep}, has_reputation=1 WHERE twitter_id='${account.twitterId}' AND is_del=0;`
  const res = await execute(sql)
  if (!res || res.length === 0) {
    return null
  }
  return res
}

async function updateUserProfile(twitterId, profileImg) {
  let sql = `UPDATE twitter_steem_mapping SET profile_img='${profileImg}' WHERE twitter_id='${twitterId}' AND is_del=0`;
  const res = await execute(sql)
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Get user's operate operation
 * @param {*} twitterId
 * @param {*} publicKey
 */
async function getRegisterOperation(twitterId, publicKey) {
  let sql = `SELECT
    twitter_username AS twitterUsername,
    profile_img AS profileImg,
    public_key AS publicKey
  FROM
    post_register
  WHERE
    twitter_id = ?
    AND public_key = ?
    AND is_del = 0`;
  const res = await execute(sql, [twitterId, publicKey]);
  if (!res || res.length === 0) {
    return null
  }
  return res[0]
}

async function getRegisterOperationByUsername(username, publicKey) {
  let sql = `SELECT
    twitter_username AS twitterUsername,
    profile_img AS profileImg,
    public_key AS publicKey
    FROM
      post_register
    WHERE
      twitter_username = ?
      AND public_key = ?
      AND is_del = 0`;
  const res = await execute(sql, [username, publicKey]);
  if (!res || res.length === 0) {
    return null
  }
  return res[0]
}

/**
 * Verify whether the Twitter account has been registered.
 * @param {String} twitterId twitter account id.
 * @returns Returns true if already registered, otherwise returns false.
 */
async function verifyTwitterIdIsRegistered(twitterId) {
  let sql =
    `SELECT
      twitter_id AS twitterId
    FROM
      twitter_steem_mapping
    WHERE
      twitter_id = ?
      AND is_del = 0
      LIMIT 1`;
  const res = await execute(sql, [twitterId]);
  return res && res.length === 1;
}

/**
 * fetch the users we dont undelegate their sp
 */
async function getUncanceledUser(daysAgo) {
  let sql = `SELECT twitter_id as twitterId, steem_id as steemId, create_time as createTime FROM twitter_steem_mapping WHERE create_time < ? AND is_del=0 AND canceled_delegation=0 AND bind_steem=0 ORDER BY create_time DESC`;
  // find out all the account registered 10 days ago 
  const users = await execute(sql, [new Date(new Date().getTime() - daysAgo * 24 * 3600000)]);
  if (users && users.length > 0) {
    return users;
  }
  return [];
}

async function updateCancelDelegateFlag(users) {
  if (users && users.length > 0) {
    let sql = '';
    for (let user of users) {
      sql += `UPDATE twitter_steem_mapping SET canceled_delegation=1 WHERE steem_id='${user.steemId}';\n`
    } 
    await execute(sql);
  }
}

/******************************************* tip *******************************************/
/**
 * Get pending register user info by twitter id
 * @param {*} twitterId 
 * @returns 
 */
async function getPendingRegisterByTwitterId(twitterId) {
  let sql = `SELECT * FROM pending_registry WHERE twitter_id = '${twitterId}'`;
  const users = await execute(sql);
  if (users && users.length > 0) {
    return users[0]
  }
  return null;
}

async function addNewPendingRecord(pendingInfo) {
  let sql = `INSERT INTO pending_registry (twitter_id) 
      VALUES(?);`;
  await execute(sql, pendingInfo.twitterId)
}

/**
 * get the the infos those user have registered and have received tip before
 * check the pending_regiter and twitter_steem_mapping table
 * if user register ok and in pending_register table, need to send fund asset to users and update the status
 * @param {*} limit 
 */
async function getNewRegiterNeedToFundAssetRecord(limit = 10) {
    let sql = `SELECT p.id, p.twitter_id as twitterId, p.trans_status as transStatus, s.steem_id as steemId
    FROM pending_registry as p
    JOIN twitter_steem_mapping as s
    ON p.twitter_id = s.twitter_id
    AND s.is_del=0
    AND p.is_registed=0
    LIMIT ?`
    const res = await execute(sql, limit)
    if (res && res.length > 0) {
      return res;
    }
    return [];
}

/******************************************* redis *******************************************/

/**
 * Generate a new register tickets
 * Include id and encrypted password
 */
// async function generateNewRegisterTicket() {
//   const password = generatePassword()
//   const id = await getKey();
//   const eth = generateETH(id, password)
//   // const web25eth = generateETH('', eth.key)
//   const pwd = b64uEnc(password);
//   console.log('set ticket', eth.address, id, password);
//   await set(eth.address, JSON.stringify({id, pwd}));
//   return { id, pwd: password }
// }

async function setRegisterTicket(address, pwd) {
  await set(address, b64uEnc(pwd))
  return {address, pwd}
}

async function getRegisterTicket(address) {
  let pwd = await get(address);
  if (pwd) {
    return hexToString(b64uDec(pwd))
  }
  return ''
}

async function removeRegisterTicket(address) {
  await del(address);
  return;
}

module.exports = {
  recordRegisterPosts,
  newRegisterOperation,
  getUnregisteredPosts,
  getUnsyncedAccount,
  setAccountsOnChain,
  registerNewAccount,
  updateRegisterPostStatus,
  verifyTwitterIdIsRegistered,
  getRegisterOperation,
  getRegisterOperationByUsername,
  setRegisterTicket,
  updateUserReputation,
  getRegisterTicket,
  removeRegisterTicket,
  updateUserProfile,
  getUncanceledUser,
  updateCancelDelegateFlag,
  getPendingRegisterByTwitterId,
  addNewPendingRecord,
  getNewRegiterNeedToFundAssetRecord
};

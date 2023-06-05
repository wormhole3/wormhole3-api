const { execute } = require("../pool");

/**
 * Inser new user info who registered newly without reputation
 * @param {*} user 
 */
async function newPendingUser(user) {
    let sql = `INSERT INTO user_info (twitter_id,username,verified,followers,following,status,registered)
    VALUES(?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE verified=?, followers=?, following=?, registered=?`

    const res = await execute(sql, [user.twitterId, user.twitterUsername, (user.verified ? 1 : 0), user.followers, user.following, 0, 1,
    (user.verified ? 1 : 0), user.followers, user.following, 1])

    if (!res || res.length === 0) {
        return null
    }
    return res
}

/**
 * Get datas from db who's reputation not calculated
 */
async function getUncalculatedReputationData() {
    let sql = `SELECT twitter_id as twitterId, verified, botometer, followers from user_info WHERE STATUS=1 AND registered=1 AND botometer > 0 AND (botometer <= 3 OR botometer > 4)`;
    const res = await execute(sql)
    if (!res || res.length === 0) {
        return []
    }
    return res
}

/**
 * finish calculate user reputation
 * @param {*} twitter_id 
 * @returns 
 */
async function finishReputationCalculate(twitter_id, status) {
    let sql = `UPDATE user_info SET status=${status} WHERE twitter_id='${twitter_id}'`;
    const res = await execute(sql);
    if (!res || res.length === 0) {
        return null
    }
    return res
}

async function getNeedIssueUsers(limit = 100) {
    let sql = "SELECT twitter_id,reputation,eth_address FROM twitter_steem_mapping WHERE is_del = 0 AND has_minted_rp = 0 AND has_reputation = 1 LIMIT ?";
    const res = await execute(sql, [parseInt(limit)]);
    if (!res || res.length === 0) {
        return []
    }
    return res
}

async function updateUserNftMint(twitter_id, has_minted = 1, reputation = null) {
    let sql = "update twitter_steem_mapping set has_minted_rp=? where twitter_id=?";
    let paras = [has_minted, twitter_id];
    if (reputation != null && false == isNaN(reputation)) {
        sql = "update twitter_steem_mapping set has_minted_rp=?,reputation=? where twitter_id=?";
        paras = [has_minted, reputation, twitter_id];
    }
    const res = await execute(sql, paras);
    return res;
}

async function getUserReputation(twitter_id = null, steem_id = null) {
    if (!twitter_id && !steem_id) return 0;
    let sql = "select reputation from twitter_steem_mapping where twitter_id=?";
    if (steem_id) sql = "select reputation from twitter_steem_mapping where steem_id=?";
    let res = null;
    if (twitter_id)
        res = await execute(sql, [twitter_id]);
    else
        res = await execute(sql, [steem_id]);
    if (res && res.length > 0) {
        return parseInt(res[0].reputation);
    }
    return 0;
}

module.exports = {
    newPendingUser,
    getUncalculatedReputationData,
    finishReputationCalculate,
    getNeedIssueUsers,
    updateUserNftMint,
    getUserReputation
}
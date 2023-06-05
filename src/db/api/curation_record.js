const { execute } = require("../pool");

async function getPendingCurations(limit = 100) {
    let sql = "SELECT tweet_id,curation_id FROM curation WHERE is_del=0 AND endtime<=unix_timestamp(NOW()) AND task_status=0 AND create_status>0 LIMIT ?";
    const res = await execute(sql, [limit]);
    if (res && res.length > 0) {
        return res;
    }
    return [];
}

async function getRecordByCuration(task) {
    let sql = "SELECT id,curation_id,twitter_id FROM curation_record WHERE task_id=? AND is_del=0 ORDER BY create_at";
    const res = await execute(sql, [task]);
    if (res && res.length > 0) {
        return res;
    }
    return [];
}

async function createCurationRecord(task_id, curation_id, twitter_id) {
    let sql = "INSERT INTO curation_record (task_id,curation_id,twitter_id) VALUE (?,?,?)";
    await execute(sql, [task_id, curation_id, twitter_id]);
}

async function setCurationIsDel(ids) {
    if (ids.length < 1) return;
    let sql = `UPDATE curation_record SET is_del=1 WHERE curation_id in ('${ids.join("','")}')`;
    if (ids.length == 1) {
        sql = `UPDATE curation_record SET is_del=1 WHERE curation_id='${ids[0]}'`;
    }
    await execute(sql);
}

async function getCurationLikeScore(curationId, ownerTwitter) {
    let sql = `SELECT A.id,A.twitter_id,B.reputation FROM like_relation AS A
        JOIN twitter_steem_mapping AS B ON B.twitter_id=A.twitter_id
        WHERE B.is_del=0 AND A.post_id=?
        AND B.twitter_id != ?
        AND B.reputation>0`;
    const res = await execute(sql, [curationId, ownerTwitter]);
    if (res && res.length > 0) {
        let score = 0;
        for (let item of res) {
            score += parseInt(item.reputation);
        }
        return score;
    }
    return 0;
}

async function saveCurationScore(scores) {
    if (scores.length < 1) return;
    let sqls = [];
    for (let score of scores) {
        sqls.push(`UPDATE curation_record SET score=${score.score},amount='${score.amount}' WHERE id=${score.id}`);
    }
    await execute(sqls.join(";") + ";");
}

async function hasCurationRecord(taskId, twitterId) {
    let sql = "select id from curation_record where task_id=? and twitter_id=?";
    const res = await execute(sql, [taskId, twitterId]);
    if (res && res.length > 0) return true;
    return false;
}

async function getNeedFeedRecords(twitterId) {
    let sql = `
        SELECT A.id,A.amount,B.eth_address FROM curation_record AS A
        JOIN twitter_steem_mapping AS B ON B.twitter_id=A.twitter_id
        WHERE A.is_del=0 AND B.is_del=0 AND A.amount!="0" AND A.is_feed=0 AND A.task_id=?`;
    const res = await execute(sql, [twitterId]);
    if (res && res.length > 0) {
        return res;
    }
    return [];
}

async function setIsFeed(ids, batch = 0) {
    if (ids.length < 1) return;
    let sql = `update curation_record set is_feed=1,batch=${batch} where id in (${ids.join(",")})`;
    if (ids.length == 1) {
        sql = `UPDATE curation_record SET is_feed=1,batch=${batch} WHERE id=${ids[0]}`;
    }
    await execute(sql);
}

/**
 * Get curation record of a task. return at most 30 records per request
 * @param {*} taskId task id hex form id
 * @param {*} lastId skip num
 */
async function getRefreshCurationRecord(taskId, lastId, isFeed) {
    lastId = lastId ?? 0;
    const feedS = isFeed ? 'AND cr.is_feed>0' : ''
    let sql = `SELECT s.twitter_id as twitterId, s.twitter_name as twitterName, s.twitter_username as twitterUsername,s.profile_img as profileImg,
        cr.create_at as createAt, cr.id,cr.curation_id as recordId, cr.amount, cr.is_feed as isFeed,
        c.token, c.decimals, c.token_name as tokenName, c.token_symbol as tokenSymbol
        FROM curation_record as cr 
        LEFT JOIN twitter_steem_mapping as s 
        ON cr.twitter_id=s.twitter_id AND s.is_del=0
        JOIN curation as c 
        ON c.tweet_id=cr.task_id
        WHERE c.create_status=1 AND c.is_del=0 AND c.curation_id='${taskId}' ${feedS}
        LIMIT 30 OFFSET ${lastId}`
    const res = await execute(sql);
    if (res && res.length > 0) {
        return res;
    }
    return [];
}

module.exports = {
    createCurationRecord,
    getPendingCurations,
    getRecordByCuration,
    setCurationIsDel,
    getCurationLikeScore,
    saveCurationScore,
    hasCurationRecord,
    getNeedFeedRecords,
    setIsFeed,
    getRefreshCurationRecord
}
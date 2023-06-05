const { execute } = require("../pool");

/**
 * Add a new curation to db
 * @param {*} curation 
 */
async function newCuration(curation) {
    const { creatorTwitter, curationId, creatorETH, content, token, name, symbol, amount, decimals, maxCount, endtime, transHash } = curation;
    const sql = `INSERT INTO curation (creator_twitter,curation_id,creator_eth,content,token,token_name,token_symbol,amount,decimals,max_count,endtime, trans_hash) VALUE (?,?,?,?,?,?,?,?,?,?,?,?)`;
    await execute(sql, [creatorTwitter, curationId, creatorETH, content, token, name, symbol, amount, decimals, maxCount, endtime, transHash])
}

/**
 * Get showing curation infos
 * @param {*} curationId curation ID
 * @param {*} twitterId check this twitter user wheather joined the curation
 * @returns 
 */
async function getCurationById(curationId, twitterId) {
    const sql = `SELECT c.curation_id as curationId, c.creator_twitter as creatorTwitter, c.creator_eth as creatorETH, c.content, c.token, c.amount, 
    c.decimals, c.max_count as maxCount, c.endtime, c.tweet_id as tweetId, c.created_time as createdTime, 
    c.token_name as tokenName, c.token_symbol as tokenSymbol, c.task_status as curationStatus, c.create_status as createStatus,
    s.twitter_username as twitterUsername, s.twitter_name as twitterName, s.steem_id as steemId, s.profile_img as profileImg,
    (select count(*) from curation_record where task_id = c.tweet_id) as totalCount
    FROM curation as c 
    JOIN twitter_steem_mapping as s 
    ON c.creator_twitter=s.twitter_id AND s.is_del=0
    WHERE c.curation_id='${curationId}';`;
    let curation = await execute(sql);
    if (curation && curation.length > 0 && twitterId) {
        const amount = await getWheatherUserJoinedCuration(curationId, twitterId);
        curation[0].joined = !!amount;
        curation[0].myRewardAmount = amount;
    }
    return curation[0];
}

async function getWheatherUserJoinedCuration(curationId, twitterId) {
    const sql = `SELECT amount FROM curation_record WHERE task_id in (select tweet_id from curation where curation_id='${curationId}') AND twitter_id='${twitterId}' AND is_del=0;`
    const res = await execute(sql);
    if (res && res.length > 0) {
        return res[0].amount
    }
    return false;
}

/**
 * Get the participant of the specify curation
 * @param {*} curationId 
 * @param {*} time the last record of last request, null is for the refresh
 */
async function getCurationParticipant(curationId, time) {
    let cursor = time ? `AND c.create_at < '${time}'` : ''
    const sql = `SELECT c.amount,c.create_at as createAt,s.profile_img as profileImg,
    s.twitter_name as twitterName, s.twitter_username as twitterUsername
    FROM curation_record as c 
    LEFT JOIN twitter_steem_mapping as s 
    ON c.twitter_id=s.twitter_id AND s.is_del=0
    WHERE c.task_id in (SELECT tweet_id FROM curation WHERE curation_id='${curationId}') ${cursor}
    ORDER BY c.create_at DESC LIMIT 30`;
    const participants = await execute(sql);
    return participants;
}

/**
 * set curation created
 * @param {*} curationId 
 * @param {*} createStatus 0: create new 1: post tweet
 */
async function updateCurationCreateStatus(curationId, createStatus) {
    const sql = `UPDATE curation SET create_status=${createStatus} WHERE curation_id='${curationId}'`
    await execute(sql)
}

/**
 * finish the curations
 * @param {*} curationIds
 */
async function updateCurationsStatus(curationIds) {
    if (curationIds.length < 1) return;
    let s = curationIds.reduce((s, c) => s + "'" + c + "',", '')
    s = s.slice(0, s.length - 1)
    const sql = `UPDATE curation SET task_status=2 WHERE curation_id in (${s})`
    await execute(sql)
}

/**
 * Monitor the curation tweet, so update to the curation record
 * @param {*} curationId 
 * @param {*} twitterId user id
 * @param {*} tweetId tweet id
 */
async function updateTweetId(curationId, twitterId, tweetId) {
    const sql = `UPDATE curation SET creator_twitter='${twitterId}', tweet_id='${tweetId}', create_status=1 WHERE curation_id='${curationId}'`;
    await execute(sql);
}

/**
 * sync curation status with contract
 * @param {*} curationId 
 * @param {*} status 
 */
async function updateCurationStatus(curationId, status) {
    const sql = `UPDATE curation SET task_status=${status} WHERE curation_id='${curationId}'`;
    await execute(sql);
}

/**
 * 
 * @param {*} status 0: open 1: pending 2: close 3: clean
 * @returns 
 */
async function getFreshCurations(status) {
    const sql = `select a.*, c.profile_img as curatorProfile, c.total_count as totalCount FROM
        (SELECT c.curation_id as curationId, c.creator_twitter as creatorTwitter, c.creator_eth as creatorETH, c.content, c.token, c.amount, 
                c.decimals, c.max_count as maxCount, c.endtime, c.tweet_id as tweetId, c.created_time as createdTime, 
                c.token_name as tokenName, c.token_symbol as tokenSymbol, c.task_status as curationStatus, c.create_status as createStatus,
                s.profile_img as profileImg, s.twitter_name as twitterName, s.twitter_username as twitterUsername,s.steem_id as steemId
            FROM curation as c LEFT JOIN twitter_steem_mapping AS s
            ON c.creator_twitter=s.twitter_id
            WHERE c.is_del=0 AND c.create_status=1 AND c.task_status=${status} AND s.is_del=0
            ORDER BY c.created_time DESC LIMIT 12) as a
        left join (select c.task_id, s.profile_img,row_number() over(partition by c.task_id order by c.create_at) as rn,
            count(*) over(partition by c.task_id) as total_count
            from curation_record as c JOIN twitter_steem_mapping as s ON c.twitter_id=s.twitter_id 
            WHERE c.is_del=0 AND s.is_del=0) as c 
        on a.tweetId=c.task_id and c.rn<=3
        ORDER BY a.createdTime DESC`;
    const res = await execute(sql);
    if (res && res.length > 0) {
        let curations = {}
        for (let curation of res) {
            if (!curations[curation.curationId]) {
                curations[curation.curationId] = { ...curation, curatorProfile: curation.curatorProfile ? [curation.curatorProfile] : null }
            } else {
                curations[curation.curationId].curatorProfile.push(curation.curatorProfile)
            }
        }
        return Object.values(curations);
    }
    return null;
}

/**
 * Get more old curations
 * @param {*} status 
 * @param {*} createdTime 
 * @returns 
 */
async function getMoreCurations(status, createdTime) {
    const sql = `select a.*, c.profile_img as curatorProfile, c.total_count as totalCount FROM
    (SELECT c.curation_id as curationId, c.creator_twitter as creatorTwitter, c.creator_eth as creatorETH, c.content, c.token, c.amount, 
            c.decimals, c.max_count as maxCount, c.endtime, c.tweet_id as tweetId, c.created_time as createdTime, 
            c.token_name as tokenName, c.token_symbol as tokenSymbol, c.task_status as curationStatus, c.create_status as createStatus,
            s.profile_img as profileImg, s.twitter_name as twitterName, s.twitter_username as twitterUsername, s.steem_id as steemId
        FROM curation as c LEFT JOIN twitter_steem_mapping AS s
        ON c.creator_twitter=s.twitter_id
        WHERE c.is_del=0 AND c.create_status=1 AND c.task_status=? AND s.is_del=0 AND c.created_time < ?
        ORDER BY c.created_time DESC LIMIT 12) as a
    left join (select c.task_id, s.profile_img,row_number() over(partition by c.task_id order by c.create_at) as rn,
        count(*) over(partition by c.task_id) as total_count
        from curation_record as c JOIN twitter_steem_mapping as s ON c.twitter_id=s.twitter_id 
        WHERE c.is_del=0 AND s.is_del=0) as c 
    on a.tweetId=c.task_id and c.rn<=3
    ORDER BY a.createdTime DESC`;
    const res = await execute(sql, [status, createdTime]);
    if (res && res.length > 0) {
        let curations = {}
        for (let curation of res) {
            if (!curations[curation.curationId]) {
                curations[curation.curationId] = { ...curation, curatorProfile: curation.curatorProfile ? [curation.curatorProfile] : null }
            } else {
                curations[curation.curationId].curatorProfile.push(curation.curatorProfile)
            }
        }
        return Object.values(curations);
    }
    return null;
}

/**
 * Get users joined curations
 * @param {*} twitterId users twitter id
 * @param {*} time the last curation time 
 */
async function getMyJoinedCurations(twitterId, time) {

    const tem = time ? `AND c.created_time < '${time}'` : ''
    const idsql = `SELECT a.task_id, a.rn
    FROM (SELECT r.*, ROW_NUMBER() over(partition by r.task_id, r.twitter_id) as rn FROM curation_record as r)a
    JOIN curation as c ON a.task_id=c.tweet_id 
    WHERE a.is_del=0 AND c.is_del=0 AND a.twitter_id='${twitterId}' AND a.rn=1 ${tem}
    ORDER BY c.created_time DESC LIMIT 12`
    let ids = await execute(idsql);
    if (!ids || ids.length === 0) {
        return null
    }
    ids = ids.reduce((s, id) => s + "'" + id.task_id + "',", '')
    ids = ids.substring(0, ids.length - 1)

    const sql = `select a.*, c.profile_img as curatorProfile, c.total_count as totalCount FROM
    (SELECT c.curation_id as curationId, c.creator_twitter as creatorTwitter, c.creator_eth as creatorETH, c.content, c.token, c.amount, 
            c.decimals, c.max_count as maxCount, c.endtime, c.tweet_id as tweetId, c.created_time as createdTime, 
            c.token_name as tokenName, c.token_symbol as tokenSymbol, c.task_status as curationStatus, c.create_status as createStatus,
            s.profile_img as profileImg, s.twitter_name as twitterName, s.twitter_username as twitterUsername, s.steem_id as steemId
        FROM curation as c JOIN twitter_steem_mapping AS s
        ON c.creator_twitter=s.twitter_id
        WHERE c.tweet_id in (${ids})) as a
    left join (select c.task_id, s.profile_img,row_number() over(partition by c.task_id order by c.create_at) as rn,
        count(*) over(partition by c.task_id) as total_count
        from curation_record as c JOIN twitter_steem_mapping as s ON c.twitter_id=s.twitter_id 
        WHERE c.is_del=0 AND s.is_del=0) as c 
    on a.tweetId=c.task_id and c.rn<=3
    ORDER BY a.createdTime DESC`;
    const res = await execute(sql)
    if (res && res.length > 0) {
        let curations = {}
        for (let curation of res) {
            if (!curations[curation.curationId]) {
                curations[curation.curationId] = { ...curation, curatorProfile: curation.curatorProfile ? [curation.curatorProfile] : null }
            } else {
                curations[curation.curationId].curatorProfile.push(curation.curatorProfile)
            }
        }
        return Object.values(curations);
    }
    return null;
}

/**
 * get my created curations
 * @param {*} twitterId 
 * @param {*} time 
 * @returns 
 */
async function getMyCreatedCurations(twitterId, time) {
    const tem = time ? `AND c.created_time < '${time}'` : ''
    const sql = `select a.*, c.profile_img as curatorProfile, c.total_count as totalCount FROM
    (SELECT c.curation_id as curationId, c.creator_twitter as creatorTwitter, c.creator_eth as creatorETH, c.content, c.token, c.amount, 
            c.decimals, c.max_count as maxCount, c.endtime, c.tweet_id as tweetId, c.created_time as createdTime, 
            c.token_name as tokenName, c.token_symbol as tokenSymbol, c.task_status as curationStatus, c.create_status as createStatus,
            s.profile_img as profileImg, s.twitter_name as twitterName, s.twitter_username as twitterUsername, s.steem_id as steemId
        FROM curation as c JOIN twitter_steem_mapping AS s
        ON c.creator_twitter=s.twitter_id
        WHERE c.creator_twitter='${twitterId}' AND c.is_del=0 AND s.is_del=0 ${tem}
        ORDER BY c.created_time DESC LIMIT 12) as a
    left join (select c.task_id, s.profile_img,row_number() over(partition by c.task_id order by c.create_at) as rn,
        count(*) over(partition by c.task_id) as total_count
        from curation_record as c JOIN twitter_steem_mapping as s ON c.twitter_id=s.twitter_id 
        WHERE c.is_del=0 AND s.is_del=0) as c 
    on a.tweetId=c.task_id and c.rn<=3
    ORDER BY a.createdTime DESC`;
    const res = await execute(sql)
    if (res && res.length > 0) {
        let curations = {}
        for (let curation of res) {
            if (!curations[curation.curationId]) {
                curations[curation.curationId] = { ...curation, curatorProfile: curation.curatorProfile ? [curation.curatorProfile] : null }
            } else {
                curations[curation.curationId].curatorProfile.push(curation.curatorProfile)
            }
        }
        return Object.values(curations);
    }
    return null;
}

async function checkCuration(retweetId) {
    let sql = "select id from curation where tweet_id=? and is_del=0 and task_status=0 and endtime>unix_timestamp(NOW())";
    const res = await execute(sql, [retweetId]);
    return res && res.length === 1;
}

async function getCurationByTweet(tweetId) {
    let sql = "select * from curation where tweet_id=?";
    const res = await execute(sql, [tweetId]);
    if (res && res.length > 0) return res[0];
    return null;
}

async function setCurationIsCalc(tweetId) {
    let sql = "update curation set is_calc=1 where tweet_id=?";
    await execute(sql, [tweetId]);
}

async function getNeedFeedCurations(limit = 100) {
    let sql = "SELECT id,curation_id,tweet_id,decimals FROM curation WHERE is_del=0 AND create_status=1 AND task_status=0 AND is_calc=1 limit ?";
    const res = await execute(sql, [limit]);
    if (res && res.length > 0) return res;
    return [];
}

async function getNeedDistribute(limit=100){
    let sql = "SELECT id,curation_id,tweet_id FROM curation WHERE is_del=0 AND create_status=1 AND task_status=1 AND is_calc=1 limit ?";
    const res = await execute(sql, [limit]);
    if (res && res.length > 0) return res;
    return [];
}

/**
 * polling the feeded curations, if admin issued all the rewards, we need to sync the status of the contract
 * @param {*} limit 
 * @returns 
 */
async function getPendingCompelet(limit = 10) {
    let sql = 'SELECT curation_id FROM curation WHERE task_status=1 AND is_del=0 LIMIT ?';
    const res = await execute(sql, limit);
    if (res && res.length > 0) return res;
    return [];
}

module.exports = {
    newCuration,
    updateTweetId,
    getCurationById,
    updateCurationCreateStatus,
    updateCurationStatus,
    getFreshCurations,
    getMoreCurations,
    checkCuration,
    getCurationByTweet,
    getNeedFeedCurations,
    setCurationIsCalc,
    getCurationParticipant,
    getWheatherUserJoinedCuration,
    getMyJoinedCurations,
    getMyCreatedCurations,
    getPendingCompelet,
    updateCurationsStatus,
    getNeedDistribute
}
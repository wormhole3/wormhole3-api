const { execute } = require("../pool");

async function insertUser(twitterId, ethAddress) {
    let sql = 'INSERT IGNORE INTO airdrop (twitter_id, eth_address) VALUES(?,?)';
    await execute(sql, [twitterId, ethAddress])
}

async function getPendingRecord(limit=10) {
    let sql = `SELECT * FROM airdrop WHERE dropped=0 LIMIT ${limit}`;
    const res = await execute(sql);
    if (res && res.length > 0) {
        return res;
    }
    return []
}

async function setDropped(twitterId, hash) {
    let sql = `UPDATE airdrop set dropped=1, hash='${hash}' WHERE twitter_id='${twitterId}'`;
    await execute(sql);
}

async function getRecord(twitterId) {
    let sql = `SELECT twitter_id as twitterId, dropped, 'hash', eth_address as ethAddress FROM airdrop WHERE twitter_id='${twitterId}'`
    const res = await execute(sql);
    if (res && res.length > 0) {
        return res[0];
    }
    return null;
}

module.exports = {
    insertUser,
    getPendingRecord,
    setDropped,
    getRecord
}
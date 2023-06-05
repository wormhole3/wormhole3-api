const { execute } = require("../pool");

/**
 * get wheather user has readed his NFT
 * @param {*} twitterId 
 * @returns 
 */
async function nftReceiveState(twitterId) {
    let sql = `SELECT has_received_nft as hasReceivedNft, reputation, has_reputation as hasReputation, has_minted_rp as hasMintedRP FROM twitter_steem_mapping WHERE twitter_id='${twitterId}' AND is_del=0`
    const res = await execute(sql);
    if (res && res.length > 0) {
        return res[0]
    }
    return null
}

/**
 * update readed state
 * @param {*} twitterId 
 */
async function readNft(twitterId) {
    let sql = `UPDATE twitter_steem_mapping SET has_received_nft=1 WHERE twitter_id='${twitterId}'`
    const res = await execute(sql);
    return res;
}

module.exports = {
    nftReceiveState,
    readNft
}
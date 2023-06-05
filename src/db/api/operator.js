const config = require("../../../operator.config.js")

// {
//     id: 1,
//     // comment
//     postingWif: process.env.TEST_USER_PRIVATE, parentAuthor: "", parentPermlink: config.PARENTPERMLINK,
//     author: "necklace", permlink: "1532021792629395456", title: "测试扩展信息，附件多图", 
//     body: "测试扩展信息，附件多图 \nhttps://pbs.twimg.com/media/FULUxOZUcAIbmSC.jpg \nhttps://pbs.twimg.com/media/FULUxOYVIAAu7RH.png https://t.co/Bu9CsbtJer", 
//     tags: ""
// }
// transfer
// { id: 1, activeWif: process.env.TEST_USER_PRIVATE, from: "necklace", to: "necklace2", amount: "1", memo: "" }
// vote
// { id: 1, postingWif, voter, author, permlink }
// follow
// { id: 1, follower, following, postingWif }
// unfollow
// { id: 1, follower, following, postingWif }

const Operator = {
    /**
     * Get comment to sent
     * @param {*} limit 
     */
    getComments: async function (limit) {
        // See: api/comment/getNotSyncedComments
        return [
            {
                id, postId, steemUserName, content, postingWif
            }
        ];
    },
    /**
     * get transfer to sent
     * @param {*} limit 
     * @returns 
     */
    getTransfers: async function (limit) {
        // See: api/send/getNotSentPosts
        return [
            {
                id, steemUserName, targetId, amount
            }
        ];
    },
    /**
     * Update record status
     * @param {*} id 
     * @param {*} status 0 fail, 1 success
     */
    updateComment: async function (id, status) {
        // See: api/comment/updateCommentStatus
    },
    /**
     * Update record status
     * @param {*} id 
     * @param {*} status 0 fail, 1 success
     */
    updateTransfer: async function (id, status) {
        // See: api/send/updateSendPostStatus
    },
    /**
     * Check if the specified user's article exists
     * @param {*} userId user's twitter id
     * @param {*} postId article id
     * @returns Returns true if already exists, otherwise returns false.
     */
    checkComment: async function (userId, postId) {
        // Needless
        // DB will verify the duplicate data by postId.
        return false;
    },
    /**
     * Check if the specified user's transfer exists
     * @param {*} userId user's twitter id
     * @param {*} postId article id
     * @returns Returns true if already exists, otherwise returns false.
     */
    checkTransfer: async function (userId, postId) {
        // Needless
        // DB will verify the duplicate data by postId.
        return false;
    }
}


module.exports = {
    Operator
};
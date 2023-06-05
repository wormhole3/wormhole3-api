/**
 * This file will cache the posts on first page showing on UI
 * 
 */

const { execute } = require("../pool");
const logger = require('../../utils/logger');
const { sleep } = require("../../utils/helper");
const {getRefreshPostsByTagTime, getRefreshPostsByTagValue, getRefreshPostsByTagTrend } = require('../api/post')

let allNewPost = []
let allTrendingPost = []
let allValuePost = []

async function updatePostByPolling() {
    logger.debug('Start udpate posts')
    while(true) {
        try {
            const [n,v,t] = await Promise.all([getRefreshPostsByTagTime('iweb3', 16), getRefreshPostsByTagValue('iweb3', 16, 0), getRefreshPostsByTagTrend('iweb3', 16, 0)])
            if(n.length >= allNewPost.length) {
                allNewPost = n
            }
            if(t.length >= allTrendingPost.length) {
                allTrendingPost = t
            }
            if(v.length >= allValuePost) {
                allValuePost = v
            }
        }catch(e) {
            logger.debug('Update post cache fail:', e)
        }
        await sleep(6)
    }
}

function getNewPost() {
    return allNewPost
}

function getTrendingPost() {
    return allTrendingPost
}

function getValuePost() {
    return allValuePost
}

module.exports = {
    updatePostByPolling,
    getNewPost,
    getTrendingPost,
    getValuePost
}
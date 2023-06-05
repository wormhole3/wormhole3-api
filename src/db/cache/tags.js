/**
 * tag aggregation info is a general data
 * so we cache them to ram when server start
 */

const { execute } = require("../pool");
const logger = require('../../utils/logger');
const { sleep } = require("../../utils/helper");

let tagAggregation = {}
let lastUpdateTime = new Date().getTime() - 6000

async function updateTag() {
    const now = new Date().getTime()
    if (now - lastUpdateTime < 5000) {
        return;
    } 
    lastUpdateTime = new Date().getTime()
    tagAggregation = {}
    let sql = 'SELECT tag, COUNT(tag) AS c FROM post_tag WHERE is_post=1 GROUP BY tag ORDER BY c DESC LIMIT 100'
    const res = await execute(sql)
    if (res && res.length > 0) {
        res.map(tag => {
            tagAggregation[tag.tag] = tag.c
        })
    }
}

async function updateTagByPolling() {
    logger.debug('Start udpate tag aggregation')
    while(true) {
        try {
            await updateTag()
        }catch(e) {
            logger.debug('Update tags aggregation fail:', e)
        }
        await sleep(300)
    }
}

function getTagAggregation() {
    return tagAggregation
}

module.exports = {
    updateTag,
    getTagAggregation,
    updateTagByPolling
}
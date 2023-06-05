const express = require("express");
const router = express.Router();
const {
    newCuration,
    updateCurationCreateStatus,
    getFreshCurations,
    getMoreCurations,
    getCurationById,
    getCurationParticipant,
    getWheatherUserJoinedCuration,
    getMyJoinedCurations,
    getMyCreatedCurations
} = require('../src/db/api/curation')
const  {
    getRefreshCurationRecord
} = require('../src/db/api/curation_record')
const {
    handleError
} = require('../src/utils/helper')
const { ethers } = require('ethers') 
const { getAccountByTwitterId } = require('../src/db/api/user')
const  { ERR_CODE } = require('../config')
const { getERC20Infos, getCuration } = require('../src/utils/ethers')
const { logger } = require('../src/utils/logger')

router.post('/newCuration', async (req, res, next) => {
    try{
        const { creatorTwitter, curationId, creatorETH, content, token, amount, maxCount, endtime, transHash } = req.body;
        if (!ethers.utils.isAddress(creatorETH)) {
            return handleError(res, 'Wrong eth address', 'Wrong eth address', ERR_CODE.PARAMS_ERROR);
        }
        if (!ethers.utils.isAddress(token)) {
            return handleError(res, 'Wrong token address', 'Wrong token address', ERR_CODE.PARAMS_ERROR);
        }
        if (!curationId || !content || !amount || !maxCount || !endtime || !transHash || !creatorTwitter) {
            logger.debug('Null param:', curationId,content,amount,maxCount,endtime,transHash,creatorTwitter)
            return handleError(res, 'Some null params', 'Some null params', ERR_CODE.PARAMS_ERROR);
        }
        let tokenInfo;
        try {
            tokenInfo = await getERC20Infos(token)
        }catch(e) {
            logger.debug('[Curation]New curation fail1:', e);
            return handleError(res, 'Read ERC20 fail', 'Read ERC20 fail', e)
        }
        // check contract
        const info = await getCuration(curationId);
        if (!info) {
            return handleError(res, e, 'Contract error', ERR_CODE.BLOCK_CHAIN_ERROR)
        }
        if (info && info.task && info.task.token === token) {
            await newCuration({...req.body, ...tokenInfo})
            return res.status(200).json()
        }
        return handleError(res, e, 'Task not exist', ERR_CODE.BLOCK_CHAIN_ERROR)
    }catch (e) {
        logger.debug('[Curation]New curation fail2:', e);
        return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR)
    }
})

router.get('/getRefreshCurations', async (req, res, next) => {
    try{
        const curations = await getFreshCurations(req.query.curationStatus)
        return res.status(200).json(curations)
    }catch(e) {
        logger.debug('Get refresh curations fail:', e);
        return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR)
    }
})

router.get('/getMoreCurations', async (req, res, next) => {
    try{
        const curations = await getMoreCurations(req.query.curationStatus, req.query.createdTime)
        return res.status(200).json(curations)
    }catch(e) {
        logger.debug('Get more curations fail:', e);
        return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR)
    }
})

router.get('/getCurationById', async (req, res, next) => {
    try{
        const curation = await getCurationById(req.query.curationId, req.query.twitterId)
        return res.status(200).json(curation)
    }catch(e) {
        logger.debug('Get specify curation fail:', e);
        return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR)
    }
})

router.get('/getCurationParticipant', async (req, res, next) => {
    try{
        const {curationId, createAt} = req.query;
        const p = await getCurationParticipant(curationId, createAt);
        return res.status(200).json(p);
    }catch(e) {
        logger.debug('Get curation participant fail:', e);
        return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR)
    }
})

router.get('/getWheatherUserJoinedCuration', async (req, res, next) => {
    try{
        const {curationId, twitterId} = req.query;
        const j = await getWheatherUserJoinedCuration(curationId, twitterId);
        return res.status(200).json(j);
    }catch(e) {
        logger.debug('Get Wheather User Joined Curation fail:', e);
        return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR)
    }
})

router.get('/getMyJoinedCurations', async (req, res, next) => {
    try{
        const { twitterId, createdTime } = req.query
        const c = await getMyJoinedCurations(twitterId, createdTime)
        return res.status(200).json(c);
    }catch(e) {
        logger.debug('Get users Joined Curations fail:', e);
        return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR)
    }
})

router.get('/getMyCreatedCurations', async (req, res, next) => {
    try{
        const { twitterId, createdTime } = req.query
        const c = await getMyCreatedCurations(twitterId, createdTime)
        return res.status(200).json(c);
    }catch(e) {
        logger.debug('Get users Joined Curations fail:', e);
        return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR)
    }
})

router.get('/getRefreshCurationRecord', async (req, res) => {
    try {
        let {taskId, lastId, isFeed} = req.query;
        if (!isFeed || isFeed === 'false' || isFeed === 0 || isFeed === '0') {
            isFeed = false
        }
        const c = await getRefreshCurationRecord(taskId, lastId, isFeed)
        return res.status(200).json(c);
    } catch (error) {
        logger.debug('Get curation records fail:', e);
        return handleError(res, e, 'DB error', ERR_CODE.DB_ERROR)
    }
})

module.exports = router
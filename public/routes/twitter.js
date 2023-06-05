const express = require("express");
const router = express.Router();
const {
  getPostsByUserRefresh,
  getMorePostsOfUser,
  getRefreshPostsByTagTime,
  getMorePostsByTagTime,
  getPostById,
  getRefreshPostsByTagValue,
  getRefreshPostsByTagTrend,
  getUserFavTag,
  getPostsByUsernameRefresh,
  getMorePostsOfUsername
} = require("../../src/db/api/post");
const  { ERR_CODE } = require('../../config')
const { getCommentsByPostid } = require('../../src/db/api/comment')
const PostCache = require('../../src/db/cache/posts')
const {
  handleError
} = require("../../src/utils/helper");
const {
  getTagAggregation
} = require('../../src/db/cache/tags')

/**
 * Get user's post by time
 * @params newPost true: get new post after the time; false: load more post before the time 
 */
router.get('/getUsersPostsByTime', async (req, res, next) => {
  let {
    twitterId,
    username,
    pageSize,
    time,
    newPost
  } = req.query;
  pageSize = pageSize ?? 30;
  if (twitterId) {
    if (newPost === 'true') {
      const posts = await getPostsByUserRefresh(twitterId, pageSize, time)
      return res.status(200).json(posts)
    } else {
      const posts = await getMorePostsOfUser(twitterId, pageSize, time)
      return res.status(200).json(posts)
    }
  }else {
    if (newPost === 'true') {
      const posts = await getPostsByUsernameRefresh(username, pageSize, time)
      return res.status(200).json(posts)
    } else {
      const posts = await getMorePostsOfUsername(username, pageSize, time)
      return res.status(200).json(posts)
    }
  }
})

router.get('/getCommentsByPostid', async (req, res, next) => {
  try {
    const {
      postId
    } = req.query;
    const comments = await getCommentsByPostid(postId)
    return res.status(200).json(comments)
  } catch (e) {
    console.error("Error: {}", e);
    return res.status(500).json({
      error: "Get comments of post failed."
    });
  }
})

router.get('/refreshByTagTime', async (req, res) => {
  let { tag, time, pageSize } = req.query;
  tag = tag ?? 'iweb3';
  pageSize = pageSize ?? 16
  if (parseInt(pageSize ?? 16) === 16 && tag === 'iweb3'){
    return res.status(200).json(PostCache.getNewPost());
  }
  const posts = await getRefreshPostsByTagTime(tag, pageSize, time)
  return res.status(200).json(posts)
})

router.get('/moreByTagTime', async (req, res) => {
  let { tag, time, pageSize } = req.query;
  tag = tag ?? 'iweb3';
  pageSize = pageSize ?? 30
  const posts = await getMorePostsByTagTime(tag, pageSize, time)
  return res.status(200).json(posts)
})

router.get('/getPostById', async (req, res) => {
  let { postId } = req.query;
  const post = await getPostById(postId);
  return res.status(200).json(post)
})

router.get('/getPostByValue', async (req, res) => {
  let { pageSize, pageNum, tag } = req.query;
  if (parseInt(pageSize ?? 16) === 16 && parseInt(pageNum ?? 0) === 0 && tag === 'iweb3'){
    return res.status(200).json(PostCache.getValuePost());
  }
  const posts = await getRefreshPostsByTagValue(tag, parseInt(pageSize ?? 16), parseInt(pageNum ?? 0))
  return res.status(200).json(posts)
})

router.get('/getPostByTrend', async (req, res) => {
  let { pageSize, pageNum, tag } = req.query;
  if (parseInt(pageSize ?? 16) === 16 && parseInt(pageNum ?? 0) === 0 && tag === 'iweb3'){
    return res.status(200).json(PostCache.getTrendingPost());
  }
  const posts = await getRefreshPostsByTagTrend(tag, parseInt(pageSize ?? 16), parseInt(pageNum ?? 0))
  return res.status(200).json(posts)
})

router.get('/tags', async (req, res) => {
  const tags = getTagAggregation()
  return res.status(200).json(tags)
})

router.get('/getUserFavTag', async (req, res) => {
  try {
    const favTag = await getUserFavTag(req.query.twitterId);
    return res.status(200).json(favTag)
  } catch (error) {
    return handleError(res, 'DB error', error, ERR_CODE.DB_ERROR)
  }
})

module.exports = router;
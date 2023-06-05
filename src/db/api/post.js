const { execute } = require("../pool");
const { format } = require('../../utils/helper');
const { logger } = require("ethers");

/**
 * Record the posts that need to be synchronized to steem.
 * @param {Object} post register post object:{postId,twitterId,twitterName,twitterUsername,content,postTime}.
 */
async function recordPostPosts(post) {
  let sql = 'INSERT INTO post_post (`post_id`,`twitter_id`,`name`,`username`,`content`,`post_time`,`tags`,`steem_id`,`page_info`, `retweet_info`, `retweet_id`, `location`) VALUE (?,?,?,?,?,?,?,?,?,?,?,?);';
  let res;
  try {
    res = await execute(sql, [post.postId, post.twitterId, post.twitterName, post.twitterUsername, post.content, post.postTime, post.tags, post.steemId, post.pageInfo, post.retweetInfo, post.retweetId, post.location]);
  } catch (error) {
    if ("ER_DUP_ENTRY" == error?.code) {
      console.warn(`Duplicate entry ${post.postId} for key post_id.`);
    }
  }
  if (!res) {
    return 0;
  }
  return res.affectedRows;
}

/**
 * Restore tags of posts or comments relation
 * @param {*} post 
 */
async function recordPostTagRelation(postId, tags, isPost) {
  let sql = ``;
  for (let tag of tags) {
    sql += `INSERT INTO post_tag (post_id,tag,is_post) VALUE('${postId}', '${tag}', ${isPost});\n`
  }
  const res = await execute(sql);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Get the unposted posts.
 * @param {Number} limit The number of post returned.
 * @returns The unposted post list.
 */
async function getUnpostedPosts(limit) {
  let size = limit || 1000;
  let sql = `SELECT B.id as id,B.post_id as postId,A.steem_id as steemUserName,A.post_key as postingWif,B.content as content,A.twitter_id as twitterId,A.last_claim_time as lastClaimTime,
  B.tags as tags, B.post_status as postStatus
  FROM twitter_steem_mapping as A 
  INNER JOIN (
    SELECT p.id,p.post_id,p.content,p.post_status,p.post_time,p.twitter_id,p.tags
    FROM (
        SELECT *, ROW_NUMBER() OVER(PARTITION BY twitter_id ORDER BY post_time ASC) as rn 
        FROM post_post 
        WHERE (post_status = 0 || post_status = 2) and is_del = 0
    ) p
    WHERE p.rn = 1
  ) as B
  ON B.twitter_id=A.twitter_id
  WHERE (A.last_post_time is NULL OR A.last_post_time < date_add( now(), INTERVAL - 5 MINUTE )) and A.is_del = 0
  LIMIT ?
`;
  const res = await execute(sql, [size]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Update the status of the post that used to post.
 * @param {String} id operation id.
 * @param {Number} status not posted: 0, posted: 1, fail: 2, retry-fail: 3， canceled: 4.
 */
async function updatePostPostStatus(id, status) {
  let sql =
    `UPDATE post_post
      SET post_status = ?
      WHERE
        id = ?
        AND is_del = 0`;
  const res = await execute(sql, [status, id]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Update last post time
 * @param {*} twitterId 
 * @param {Bool} claimedRewards wheather claimed user's rewards
 * @returns 
 */
async function updateLastPostTime(twitterId, claimedRewards = false) {
  let sql = `UPDATE twitter_steem_mapping SET last_post_time=now() WHERE twitter_id=?`;
  if (claimedRewards) {
    sql = `UPDATE twitter_steem_mapping SET last_post_time=now(), last_claim_time=now() WHERE twitter_id=?`;
  }
  const res = await execute(sql, [twitterId]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

async function updateClaimRewardsTime(twitterId) {
  let sql = `UPDATE twitter_steem_mapping SET last_claim_time=now() WHERE twitter_id=?`;
  const res = await execute(sql, [twitterId]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * If send the post to steem success, we need to change some state of this post in db
 * @param {*} id post_post master key
 * @param {*} twiiterId post authors twitter id
 * @param {*} postId post id
 * @param {*} tags post tags
 */
async function newPostOnChain(id, twiiterId, postId, tags) {
  let sql = ''
  // update last Post time
  sql += `UPDATE twitter_steem_mapping SET last_post_time=now() WHERE twitter_id='${twiiterId}';\n`;
  // update post state
  sql += `UPDATE post_post SET post_status = 1 WHERE id = ${id} AND is_del = 0;\n`;
  // update tag table
  for (let tag of tags) {
    sql += `INSERT INTO post_tag (post_id,tag,is_post) VALUE('${postId}', '${tag}', 1);\n`
  }
  const res = await execute(sql);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Check if the specified article exists
 * @param {String} postId Post ID.
 * @returns Returns true if exists, otherwise returns false
 */
async function hasPost(postId) {
  let sql =
    `SELECT
      post_id AS postId
    FROM
      post_post
    WHERE
      post_id = ?
      AND is_del = 0
      LIMIT 1`;
  const res = await execute(sql, [postId]);
  return res && res.length === 1;
}

async function getPostById(postId) {
  let sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,p.tags,s.profile_img as profileImg, p.steem_id as steemId, p.retweet_info as retweetInfo, p.page_info as pageInfo, p.location
  FROM post_post as p
  LEFT JOIN twitter_steem_mapping as s ON s.twitter_username = p.username
  WHERE
   p.is_del = 0
   AND p.post_status = 1
   AND s.is_del = 0
   AND p.post_id = ?
  `
  const res = await execute(sql, postId)
  if (res && res.length > 0) {
    return res[0]
  }
  return []
}

/**
 * Get posts those created within 7 days to update post value
 */
async function getPostsWithin7Days() {
  let sql = `SELECT id, post_id as permlink, steem_id as author, create_time, value,twitter_id,post_time FROM post_post WHERE is_del=0 AND create_time > ?`;
  const posts = await execute(sql, format(new Date(new Date().getTime() - 7 * 24 * 3600000)))
  return posts;
}

async function updatePostsValue(posts, values, trendingScores) {
  if (posts.length != values.length || posts.length != trendingScores.length) {
    console.log(`[${new Date().toISOString()}] Update post value: array not same length. pLength:${posts.length}, vLength:${values.length}, tLength:${trendingScores.length}`)
    return;
  }
  let sql = ''
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const value = values[i];
    const trendingScore = trendingScores[i];
    if (Math.abs(post.value - value) < 0.01 || value <= 0) {
      sql += `UPDATE post_post SET trending_score=${trendingScore} WHERE id = ${post.id};\n`
      continue;
    }
    sql += `UPDATE post_post SET value=${value},trending_score=${trendingScore} WHERE id = ${post.id};\n`
  }
  if (sql.length > 0) {
    await execute(sql)
  }
}

/**
 * get new post of user
 * @param {*} twitterId 
 * @param {*} limit 
 * @param {*} time get the new posts after this time
 */
async function getPostsByUserRefresh(twitterId, limit, time) {
  let sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,p.tags,s.profile_img as profileImg, p.steem_id as steemId, p.retweet_info as retweetInfo, p.page_info as pageInfo, p.location
  FROM post_post as p
  LEFT JOIN twitter_steem_mapping as s ON s.twitter_id = p.twitter_id
  WHERE
    p.twitter_id = ?
    AND p.is_del = 0
    AND s.is_del = 0
    AND p.post_status = 1
    `
  if (time) {
    sql += `AND p.post_time > ?
      ORDER BY p.post_time ASC
      LIMIT ?`
    const res = await execute(sql, [twitterId, time, parseInt(limit)])
    if (!res || res.length === 0) {
      return []
    }
    return res.reverse()
  } else {
    sql += `ORDER BY p.post_time DESC
    LIMIT ?`
    const res = await execute(sql, [twitterId, parseInt(limit)])
    if (!res || res.length === 0) {
      return []
    }
    return res
  }
}

/**
 * get more posts of user before time
 * @param {*} twitterId 
 * @param {*} limit 
 * @param {*} time 
 */
async function getMorePostsOfUser(twitterId, limit, time) {
  let sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,tags,s.profile_img as profileImg, p.steem_id as steemId, p.retweet_info as retweetInfo, p.page_info as pageInfo, p.location
    FROM post_post as p
    LEFT JOIN twitter_steem_mapping as s ON s.twitter_id = p.twitter_id
    WHERE
      p.twitter_id = ?
      AND p.is_del = 0
      AND s.is_del = 0
      AND p.post_status = 1
      AND p.post_time < ?
    ORDER BY p.post_time DESC
    LIMIT ?
    `
  const res = await execute(sql, [twitterId, time, parseInt(limit)])
  if (!res || res.length === 0) {
    return []
  }
  return res
}

/**
 * get new post of user
 * @param {*} twitterId 
 * @param {*} limit 
 * @param {*} time get the new posts after this time
 */
 async function getPostsByUsernameRefresh(username, limit, time) {
  let sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,p.tags,s.profile_img as profileImg, p.steem_id as steemId, p.retweet_info as retweetInfo, p.page_info as pageInfo, p.location
  FROM post_post as p
  LEFT JOIN twitter_steem_mapping as s ON s.twitter_id = p.twitter_id
  WHERE
    p.username = ?
    AND p.is_del = 0
    AND s.is_del = 0
    AND p.post_status = 1
    `
  if (time) {
    sql += `AND p.post_time > ?
      ORDER BY p.post_time ASC
      LIMIT ?`
    const res = await execute(sql, [username, time, parseInt(limit)])
    if (!res || res.length === 0) {
      return []
    }
    return res.reverse()
  } else {
    sql += `ORDER BY p.post_time DESC
    LIMIT ?`
    const res = await execute(sql, [username, parseInt(limit)])
    if (!res || res.length === 0) {
      return []
    }
    return res
  }
}

/**
 * get more posts of user before time
 * @param {*} twitterId 
 * @param {*} limit 
 * @param {*} time 
 */
async function getMorePostsOfUsername(username, limit, time) {
  let sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,tags,s.profile_img as profileImg, p.steem_id as steemId, p.retweet_info as retweetInfo, p.page_info as pageInfo, p.location
    FROM post_post as p
    LEFT JOIN twitter_steem_mapping as s ON s.twitter_id = p.twitter_id
    WHERE
      p.username = ?
      AND p.is_del = 0
      AND s.is_del = 0
      AND p.post_status = 1
      AND p.post_time < ?
    ORDER BY p.post_time DESC
    LIMIT ?
    `
  const res = await execute(sql, [username, time, parseInt(limit)])
  if (!res || res.length === 0) {
    return []
  }
  return res
}

/**
 * Get new posts by tag sorted by time
 * @param {String} tag 
 * @param {Number} limit 
 * @param {String} time 
 * @returns 
 */
async function getRefreshPostsByTagTime(tag, limit, time) {
  if (time) {
    const sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,s.profile_img as profileImg,p.tags, p.steem_id as steemId, p.retweet_info as retweetInfo, p.page_info as pageInfo, p.location FROM post_tag as t
    LEFT JOIN post_post as p ON t.post_id = p.post_id
    LEFT JOIN twitter_steem_mapping as s ON s.twitter_username = p.username
    WHERE p.is_del = 0 AND t.is_post = 1 AND p.post_status = 1 AND s.is_del=0
    AND p.post_time > ?
    AND t.tag = ?
    ORDER BY p.post_time ASC
    LIMIT ?`
    const res = await execute(sql, [time, tag, parseInt(limit)])
    if (!res || res.length === 0) {
      return []
    }
    return res.reverse()
  } else {
    const sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,s.profile_img as profileImg,p.tags, p.steem_id as steemId, p.retweet_info as retweetInfo, p.page_info as pageInfo, p.location FROM post_tag as t
    LEFT JOIN post_post as p ON t.post_id = p.post_id
    LEFT JOIN twitter_steem_mapping as s ON s.twitter_username = p.username
    WHERE p.is_del = 0 AND t.is_post = 1 AND p.post_status = 1 AND s.is_del=0
    AND t.tag = ?
    ORDER BY p.post_time DESC
    LIMIT ?`
    const res = await execute(sql, [tag, parseInt(limit)])
    if (!res || res.length === 0) {
      return []
    }
    return res
  }
}

/**
 * Fetch all posts of sepecify tag sorted by time
 * @param {*} tag 
 * @param {*} limit 
 * @param {*} time 
 */
async function getMorePostsByTagTime(tag, limit, time) {
  let sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,s.profile_img as profileImg,p.tags, p.steem_id as steemId, p.retweet_info as tweetInfo, p.page_info as pageInfo, p.location FROM post_tag as t
      LEFT JOIN post_post as p ON t.post_id = p.post_id
      LEFT JOIN twitter_steem_mapping as s ON s.twitter_username = p.username
      WHERE p.is_del = 0 AND t.is_post = 1 AND p.post_status = 1 AND s.is_del = 0
      AND t.tag = ? AND p.post_time < ?
      ORDER BY p.post_time DESC
      LIMIT ?
    `
  const res = await execute(sql, [tag, time, parseInt(limit)])
  if (!res || res.length === 0) {
    return []
  }
  return res
}

async function getRefreshPostsByTagValue(tag, pageSize = 16, pageNum = 0) {
  let sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,s.profile_img as profileImg,p.tags, p.steem_id as steemId, p.retweet_info as tweetInfo, p.page_info as pageInfo, p.location FROM post_tag as t
  LEFT JOIN post_post as p ON t.post_id = p.post_id
  LEFT JOIN twitter_steem_mapping as s ON s.twitter_username = p.username
  WHERE p.is_del = 0 AND t.is_post = 1 AND p.post_status = 1 AND s.is_del = 0
  AND t.tag = ?
  ORDER BY p.value DESC
  LIMIT ? OFFSET ?`;
  const posts = await execute(sql, [tag, pageSize, pageSize * pageNum])
  return posts;
}

async function getRefreshPostsByTagTrend(tag, pageSize = 16, pageNum = 0) {
  let sql = `SELECT p.post_id as postId,p.name,p.username,p.content,p.post_time as postTime,s.profile_img as profileImg,p.tags, p.steem_id as steemId, p.retweet_info as tweetInfo, p.page_info as pageInfo, p.location FROM post_tag as t
  LEFT JOIN post_post as p ON t.post_id = p.post_id
  LEFT JOIN twitter_steem_mapping as s ON s.twitter_username = p.username
  WHERE p.is_del = 0 AND t.is_post = 1 AND p.post_status = 1 AND s.is_del = 0
  AND t.tag = ?
  ORDER BY p.trending_score DESC
  LIMIT ? OFFSET ?`;
  const posts = await execute(sql, [tag, pageSize, pageSize * pageNum])
  return posts;
}

async function getUserFavTag(twitterId) {
  let sql = `SELECT COUNT(*) as c, a.tag
    FROM
    (SELECT t.tag, p.twitter_id as twitterId FROM post_tag as t
    JOIN post_post as p
    ON t.post_id=p.post_id
    WHERE p.twitter_id='${twitterId}') a
    GROUP BY a.tag,a.twitterId
    ORDER BY c DESC LIMIT 4`;
  const favTag = await execute(sql);
  return favTag;
}

module.exports = {
  recordPostPosts,
  getUnpostedPosts,
  updatePostPostStatus,
  hasPost,
  getPostById,
  updateLastPostTime,
  newPostOnChain,
  getPostsByUserRefresh,
  getMorePostsOfUser,
  recordPostTagRelation,
  getRefreshPostsByTagTime,
  getMorePostsByTagTime,
  updateClaimRewardsTime,
  getPostsWithin7Days,
  updatePostsValue,
  getRefreshPostsByTagValue,
  getRefreshPostsByTagTrend,
  getUserFavTag,
  getPostsByUsernameRefresh,
  getMorePostsOfUsername
};

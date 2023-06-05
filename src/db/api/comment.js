const { execute } = require("../pool");

/**
 * Record the comments that need to be synchronized to steem.
 * @param {Object} comment comment object:{commentId,parentId,twitterId,twitterName,twitterUsername,content,commentTime,commentStatus}.
 */
async function recordComments(comment) {
  let sql = 'INSERT INTO post_comment (`comment_id`,`parent_id`,`twitter_id`,`parent_twitter_id`,`name`,`username`,`content`,`comment_time`,`comment_status`,`tags`, `steem_id`, `location`) VALUE (?,?,?,?,?,?,?,?,?,?,?,?);';
  let res;
  try {
    res = await execute(sql, [comment.commentId, comment.parentId, comment.twitterId, comment.parentTwitterId, comment.twitterName, comment.twitterUsername, comment.content, comment.commentTime, comment.commentStatus,comment.tags, comment.steemId, comment.location]);
  } catch (error) {
    if ("ER_DUP_ENTRY" == error?.code) {
      console.warn(`Duplicate entry ${comment.commentId} for key comment_id.`);
    }
  }
  if (!res) {
    return 0;
  }
  return res.affectedRows;
}

/**
 * Get the comments that have not been synced to steem.
 * @param {Number} limit The number of comment returned.
 * @returns The not synced comment list.
 */
async function getNotSyncedComments(limit) {
  let size = limit || 1000;
//   let sql = `SELECT B.id as id,B.comment_id as commentId,A.steem_id as steemUserName,A.post_key as postingWif,B.content as content,B.parent_id as parentId,A.twitter_id as twitterId,B.tags,
// ( SELECT t.steem_id FROM twitter_steem_mapping AS t WHERE t.twitter_id = B.parent_twitter_id AND t.is_del = 0 ) AS parentSteemUserName
// FROM twitter_steem_mapping as A 
// INNER JOIN (
// 	SELECT p.id,p.comment_id,p.content,p.comment_status,p.comment_time,p.twitter_id,p.parent_id,p.parent_twitter_id,p.tags 
//   	FROM (
//         SELECT *, ROW_NUMBER() OVER(PARTITION BY twitter_id ORDER BY comment_time ASC) as rn 
//         FROM post_comment 
//         WHERE (comment_status = 0 || comment_status = 2) and is_del = 0
//     ) p
//     WHERE p.rn = 1
// ) as B
// ON B.twitter_id=A.twitter_id
// WHERE (A.last_post_time is NULL OR A.last_post_time < date_add( now(), INTERVAL - 5 MINUTE )) and A.is_del = 0
// LIMIT ?
//   `
  let sql =`SELECT A.id as id, A.comment_id as commentId, A.parent_id as parentId, A.content as content, A.tags,A.comment_status as commentStatus, A.location,
B.post_key as postingWif, B.twitter_id as twitterId, B.steem_id as steemUserName,
C.steem_id AS parentSteemUserName
FROM (SELECT * FROM 
        (SELECT id,comment_id,parent_id,content,tags,comment_status,location,is_del,twitter_id,parent_twitter_id,
        ROW_NUMBER () Over (PARTITION BY twitter_id ORDER BY id) as r FROM post_comment) t
    WHERE r<=1) AS A
INNER JOIN twitter_steem_mapping AS B ON B.twitter_id = A.twitter_id and B.is_del = 0
INNER JOIN twitter_steem_mapping AS C ON C.twitter_id = A.parent_twitter_id and C.is_del = 0
INNER JOIN post_post AS P ON P.post_id = A.parent_id and P.post_status = 1 and P.is_del = 0
WHERE (A.comment_status = 0 || A.comment_status = 2) and A.is_del = 0
LIMIT ?
`
  const res = await execute(sql, [size]);
  if (!res || res.length === 0) {
    return null
  }
  return res
}

/**
 * Update the status of the comment.
 * @param {String} id operation id.
 * @param {Number} status not synced: 0, synced: 1, fail: 2, retry-fail: 3， canceled: 4.
 */
async function updateCommentStatus(id, status) {
  let sql =
    `UPDATE post_comment
      SET comment_status = ?
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
 * Check if the specified comment exists.
 * @param {String} commentId Comment ID.
 * @returns Returns true if exists, otherwise returns false
 */
async function hasComment(commentId) {
  let sql =
    `SELECT
      comment_id AS commentId
    FROM
      post_comment
    WHERE
      comment_id = ?
      AND is_del = 0
      LIMIT 1`;
  const res = await execute(sql, [commentId]);
  return res && res.length === 1;
}

async function getCommentsByPostid(postId) {
  let sql = 
  `SELECT p.comment_id as commentId,p.twitter_id as twitterId,p.name,p.username,p.content,p.comment_time as commentTime,p.tags,p.steem_id as steemId, p.location, s.profile_img as profileImg
  FROM post_comment as p
  LEFT JOIN twitter_steem_mapping as s ON s.twitter_id = p.twitter_id
  WHERE
    p.parent_id = ?
    AND p.is_del = 0
    AND p.comment_status = 1
    AND s.is_del = 0
  ORDER BY comment_time DESC`
  const res = await execute(sql, [postId])
  if (!res || res.length === 0) {
    return []
  }
  return res
}

module.exports = {
  recordComments,
  getNotSyncedComments,
  updateCommentStatus,
  hasComment,
  getCommentsByPostid
};

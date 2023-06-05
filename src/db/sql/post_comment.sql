/*
 Navicat Premium Data Transfer

 Source Server         : warm-hole
 Source Server Type    : MySQL
 Source Server Version : 80029
 Source Host           : 128.199.6.94:3306
 Source Schema         : wormwole-test

 Target Server Type    : MySQL
 Target Server Version : 80029
 File Encoding         : 65001

 Date: 08/07/2022 10:33:16
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for post_comment
-- ----------------------------
DROP TABLE IF EXISTS `post_comment`;
CREATE TABLE `post_comment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `comment_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 评论唯一ID，在Twitter中全局唯一',
  `parent_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 帖子或评论唯一ID，在Twitter中全局唯一，评论的父帖子或父评论，即评论的目标',
  `twitter_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 账号',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter 名字',
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter username',
  `content` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 评论完整内容',
  `comment_time` timestamp NOT NULL COMMENT '评论时间',
  `comment_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '评论同步到Steem状态：0:未同步，1:已同步，2:同步失败，3:重试失败',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_del` tinyint(1) NOT NULL DEFAULT '0',
  `parent_twitter_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '父文章的作者id',
  `tags` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `steem_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '回复者的steem id',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `comment_id` (`comment_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发帖的Twitter帖子信息，除注册转账外的帖子，真正需要发帖的帖子。';

SET FOREIGN_KEY_CHECKS = 1;

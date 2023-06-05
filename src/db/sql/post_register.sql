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

 Date: 08/07/2022 10:35:59
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for post_register
-- ----------------------------
DROP TABLE IF EXISTS `post_register`;
CREATE TABLE `post_register` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 帖子唯一ID，在Twitter中全局唯一',
  `twitter_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 账号',
  `twitter_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter 名字',
  `twitter_username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter username',
  `content` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 帖子完整内容',
  `public_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'public key',
  `post_time` timestamp NOT NULL COMMENT '发帖时间',
  `register_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '注册状态：0:未注册，1:已注册，2:注册失败，3:重试失败, 4:已处理',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_del` tinyint(1) NOT NULL DEFAULT '0',
  `profile_img` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户的头像',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `post_id` (`post_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='注册的Twitter帖子信息';

SET FOREIGN_KEY_CHECKS = 1;

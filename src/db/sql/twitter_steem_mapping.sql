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

 Date: 08/07/2022 10:36:39
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for twitter_steem_mapping
-- ----------------------------
DROP TABLE IF EXISTS `twitter_steem_mapping`;
CREATE TABLE `twitter_steem_mapping` (
  `twitter_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter账号',
  `steem_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Steem 账号ID',
  `twitter_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter名字',
  `twitter_username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter username',
  `post_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '提供注册的Twitter帖子的ID',
  `post_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Steem Post Key',
  `eth_address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '注册好的eth地址',
  `encrypted_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '注册成功后进行加密的私钥',
  `register_time` timestamp NULL DEFAULT NULL COMMENT 'Steem注册时间',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_del` tinyint(1) NOT NULL DEFAULT '0',
  `last_post_time` timestamp NULL DEFAULT '2022-01-01 00:00:00',
  `web25ETH` varchar(42) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'web2.5 的eth地址',
  `web25Private` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'web2.5 的eth私钥',
  `is_to_blockchain` tinyint(1) NOT NULL DEFAULT '0',
  `profile_img` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户头像',
  PRIMARY KEY (`twitter_id`,`steem_id`) USING BTREE,
  UNIQUE KEY `steem_id` (`steem_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;

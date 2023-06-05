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

 Date: 08/07/2022 10:36:23
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for post_send
-- ----------------------------
DROP TABLE IF EXISTS `post_send`;
CREATE TABLE `post_send` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 帖子唯一ID，在Twitter中全局唯一',
  `twitter_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 账号',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter 名字',
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter username',
  `content` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 帖子完整内容',
  `post_time` timestamp NOT NULL COMMENT '发帖时间',
  `target_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '转账目标用户的Twitter 账号id',
  `amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '转账金额',
  `send_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '转账状态：0:未转账，1:已转账，2:失败， 3，重试失败，4.其他',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_del` tinyint(1) NOT NULL DEFAULT '0',
  `chain_name` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '链的名字',
  `asset` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '转账的资产symbol',
  `contract` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '转账的资产合约地址，可为空',
  `target_address` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '转账对方的地址或steem账号，可空',
  `send_result` int DEFAULT NULL COMMENT '操作的执行结果，枚举, 0:成功，1.余额不足，2。gas不足，3.交易失败，4.对方地址不存在',
  `transaction_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '交易hash',
  `target_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'twitter内容中用户输入的接收方账号',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `post_id` (`post_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='转账的Twitter帖子信息';


SET FOREIGN_KEY_CHECKS = 1;

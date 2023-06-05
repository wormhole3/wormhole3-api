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

 Date: 25/07/2022 09:08:22
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for follow_relation
-- ----------------------------
DROP TABLE IF EXISTS `follow_relation`;
CREATE TABLE `follow_relation` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `twitter_id` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8_general_ci NOT NULL COMMENT '推特号id',
  `following_id` varchar(64) NOT NULL DEFAULT '0' COMMENT '正在关注的用户推特id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=181 DEFAULT CHARSET=utf8mb3 COMMENT='关注矩阵用户关系表';

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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发帖的Twitter帖子信息，除注册转账外的帖子，真正需要发帖的帖子。';

-- ----------------------------
-- Table structure for post_post
-- ----------------------------
DROP TABLE IF EXISTS `post_post`;
CREATE TABLE `post_post` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 帖子唯一ID，在Twitter中全局唯一',
  `twitter_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 账号',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter 名字',
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twitter username',
  `content` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Twitter 帖子完整内容',
  `post_time` timestamp NOT NULL,
  `post_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '发帖同步到Steem状态：0:未同步，1:已同步，2:同步失败，3:重试失败',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_del` tinyint(1) NOT NULL DEFAULT '0',
  `tags` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `steem_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发帖成功后记录发帖者steemid',
  `retweet_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '转推的推id，为null就没有转推',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `post_id` (`post_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='发帖的Twitter帖子信息，除注册转账外的帖子，真正需要发帖的帖子。';

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
  `followers` int DEFAULT NULL COMMENT '被关注数量',
  `following` int DEFAULT NULL COMMENT '关注数量',
  `verified` tinyint(1) DEFAULT NULL COMMENT '是否官方认证的',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `post_id` (`post_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='注册的Twitter帖子信息';

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

-- ----------------------------
-- Table structure for post_tag
-- ----------------------------
DROP TABLE IF EXISTS `post_tag`;
CREATE TABLE `post_tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` varchar(32) NOT NULL COMMENT '帖子id,twitter的id，不是数据库的id',
  `tag` varchar(32) NOT NULL COMMENT '帖子标签',
  `is_post` tinyint(1) DEFAULT NULL COMMENT '0：评论，1：帖子',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `last_claim_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上次为用户申领奖励的时间',
  `reputation` bigint NOT NULL DEFAULT '-1' COMMENT '用户声誉分',
  `has_reputation` tinyint(1) NOT NULL DEFAULT '0' COMMENT '声誉分是否计算完成',
  PRIMARY KEY (`twitter_id`,`steem_id`) USING BTREE,
  UNIQUE KEY `steem_id` (`steem_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for user_info
-- ----------------------------
DROP TABLE IF EXISTS `user_info`;
CREATE TABLE `user_info` (
  `twitter_id` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8_general_ci NOT NULL COMMENT '推特号id',
  `username` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8_general_ci NOT NULL COMMENT '推特账号名',
  `verified` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否推特认证',
  `followers` int NOT NULL DEFAULT '0' COMMENT '关注者数量',
  `following` int NOT NULL DEFAULT '0' COMMENT '正在关注的数量',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0为未完成数据抓取,1为已完成数据抓取,未完成计算,2为已完成计算，3.用户开启隐私保护',
  `registered` tinyint(1) DEFAULT NULL COMMENT '是否是注册用户',
  PRIMARY KEY (`twitter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='关注矩阵用户信息表';

SET FOREIGN_KEY_CHECKS = 1;

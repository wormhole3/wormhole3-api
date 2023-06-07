require("dotenv").config();
const { b64uDec } = require('./src/utils/helper')

/**
 * DB
 */
const REDIS_PWD = b64uDec(process.env.REDIS_PWD)
const DB_PASSWORD = b64uDec(process.env.DB_PASSWORD)

// twitte auth config
const LoginPageUrl = process.env.LoginPageUrl;
const callback = process.env.callback;

// Redis expire time(second).
const REDIS_EXPIRE_TIME = 1000 * 60;

const ERR_CODE = {

    PARAMS_ERROR: 301,
    WRONG_TASK_CATEGORY: 302,
    TWEET_CONTENT_TOPIC_MISMATCH: 303,
    CURATION_TASK_MISMATCH: 304,
    CURATION_NOT_EXIST:305,
    INSUFFICIENT_CONTENT: 306,
    INSUFFICIENT_RC: 307,
    IS_LIKED: 308,
    IS_UNLIKED: 309,

    DB_ERROR: 501,
    BLOCK_CHAIN_ERROR: 502,
    INVALID_TRANSACTION: 503,
    SERVER_ERROR: 504,
    TWITTER_ERR: 505,
    INVALID_TWITTER_ID: 506,
    WRONG_BOX_INFO_ON_CHAIN: 507,
    USER_NOT_REGISTERED: 508,

    WRONG_ERC20: 601,

    TWEET_NOT_FOUND: 701,
    POST_NOTE_FOUND: 702
}

/**
 * user auth err code
 */
const AuthErrCode = {
    InvalidAccessToken: 401,
    TokenExpired: 401,
    InvalidState: 402,
    UserCancelAuth: 403,
    InvalidCode: 405,
    RegisterOutTime: 406,
    HasRegistered: 407
}

/**
 * redis key
 * store user's auth info include app state and user access token
 */
const UserAuthKeyPre = process.env.UserAuthKeyPre;
/**
 *  A flag to sign wheather account is in registering process
 */
const REDIS_REGISTERING_PRE = process.env.REDIS_REGISTERING_PRE;
/**
 * A queue key of redis which records all the register operations, will taked by register server one by one
 */
const REDIS_REGISTER_KEY = process.env.REDIS_REGISTER_KEY;

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = b64uDec(process.env.TWITTER_CLIENT_SECRET);
const TWITTER_REPLY_REDIS_KEY = 'WH3-REPLY-ACCOUNT-KEY';

// wormhole3 twitter id, use this steem account to post twitters those author not registered
const Wormhole3TwitterId = '1550046181283483648';

module.exports = {
    REDIS_PWD,
    DB_PASSWORD,
    LoginPageUrl,
    callback,
    REDIS_EXPIRE_TIME,
    ERR_CODE,
    AuthErrCode,
    UserAuthKeyPre,
    REDIS_REGISTERING_PRE,
    REDIS_REGISTER_KEY,
    TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET,
    TWITTER_REPLY_REDIS_KEY,
    Wormhole3TwitterId
}

require("dotenv").config();
const { b64uDec } = require('./src/utils/helper')

const Send_Key_Private = b64uDec(process.env.PWD_SEND_SERVER_PRIV_KEY)
const FAUCET_KEY = b64uDec(process.env.FAUCET_KEY)  // for test usdt
const AIRDROP_KEY = b64uDec(process.env.AIRDROP_KEY)  // matic

const Send_Key_Nonce = '111111111111111111111111111111111111111111111111'

const STEEM_RPC = [
    "https://api.steemit.com",
    "https://api.justyy.com",
    "https://api.steem.fans",
    "https://steem.61bts.com"
];

/**
 * DB
 */
const REDIS_PWD = b64uDec(process.env.REDIS_PWD)
const DB_PASSWORD = b64uDec(process.env.DB_PASSWORD)

const CURATION_CONTRACT = '0x4C524F03Bdf073A0a064Cd20c0bD9330c0FEab93'

// BSC TEST
// const RPC_NODE = 'https://data-seed-prebsc-1-s1.binance.org:8545'
const RPC_NODE = 'https://polygon-rpc.com'
// const RPC_NODE = 'HTTP://127.0.0.1:8545'
// const RPC_NODE = 'https://rpc-mainnet.matic.quiknode.pro'

// Redis expire time(second).
const REDIS_EXPIRE_TIME = 1000 * 60;

const ERR_CODE = {
    PARAMS_ERROR: 3001,

    DB_ERROR: 5001,
    BLOCK_CHAIN_ERROR: 5002,

    WRONG_ERC20: 6001,
}

// airdrop
const Matic_Airdrop_Amount = '0.2';

module.exports = {
    Send_Key_Private,
    Send_Key_Nonce,
    STEEM_RPC,
    REDIS_PWD,
    DB_PASSWORD,
    REDIS_EXPIRE_TIME,
    ERR_CODE,
    RPC_NODE,
    FAUCET_KEY,
    Matic_Airdrop_Amount,
    AIRDROP_KEY,
    CURATION_CONTRACT
}

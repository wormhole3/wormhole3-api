const { auth } = require("steem");
const { key_utils, hash } = require("steem/lib/auth/ecc");
const { u8arryToHex } = require('../utils/helper')
const { ethers } = require('ethers')

const generatePassword = () => {
  return "P" + key_utils.get_random_key().toWif();
};

const generateAuth = (user, pass, type) => {
  const key = auth.getPrivateKeys(user, pass, [type]);

  const publicKey = auth.wifToPublic(Object.values(key)[0]);
  if (type == "memo") {
    return {
      key: key,
      auth: publicKey
    };
  } else {
    return {
      key: key,
      auth: {
        weight_threshold: 1,
        account_auths: [],
        key_auths: [[publicKey, 1]]
      }
    };
  }
};

const generateETH = (username, pass) => {
   // convert posting key to eth key
   var seed = 'wormhole' + 'posting' + pass;
   var brainKey = seed.trim().split(/[\t\n\v\f\r ]+/).join(' ');
   var hashSha256 = hash.sha256(brainKey);
   var privateKey = u8arryToHex(hashSha256);
 
   const wallet = new ethers.Wallet(privateKey)
   return { 
    key: privateKey,
    address: wallet.address 
  }
}

const generateKeys = (username, pass) => {
  const owner = generateAuth(username, pass, "owner");
  const active = generateAuth(username, pass, "active");
  const posting = generateAuth(username, pass, "posting");
  const memo = generateAuth(username, pass, "memo");

  return {
    key: {
      owner: owner.key,
      active: active.key,
      posting: posting.key,
      memo: memo.key
    },
    auth: {
      owner: owner.auth,
      active: active.auth,
      posting: posting.auth,
      memo: memo.auth
    }
  };
};

const authorize = (account, authorized, permission = "posting") => {
  // only allow authorize of posting and active permissions
  if (["posting", "active"].includes(permission) && account[permission]) {
    account[permission]["account_auths"].push([authorized, 1]);
    return account;
  } else {
    return account;
  }
}

module.exports = {
  generatePassword,
  generateKeys,
  generateETH,
  authorize
}
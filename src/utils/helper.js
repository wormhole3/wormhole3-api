const moment = require("moment");
const { TwitterApi } = require("twitter-api-v2");

const b64uLookup = {
  "/": "_",
  _: "/",
  "+": "-",
  "-": "+",
  "=": ".",
  ".": "=",
  "N": 'p',
  "p": 'N'
};
const b64uEnc = (str) =>
  Buffer.from(str)
    .toString("base64")
    .replace(/(\+|\/|=)/g, (m) => b64uLookup[m]);

const b64uDec = (str) =>
  Buffer.from(
    str.replace(/(-|_|\.)/g, (m) => b64uLookup[m]),
    "base64"
  ).toString();

const sleep = async (interval) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, interval * 1000);
  })
}

/**
 * It is recommended to sleep >= 10s, and use this function only if the function needs to end in advance
 * @param {*} interval sleeping time
 * @param {*} callback step callback, Returns true to end sleep early.
 * @param {*} step Check interval, seconds
 */
const sleep2 = async (interval, callback = null, step = 5) => {
  let t = Date.now() + interval * 1000;
  while (Date.now() < t) {
    await sleep(step);
    if (callback && callback()) break;
  }
};

const u8arryToHex = (buffer) => {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('')
}

const hexTou8array = (hex) => {
  return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
}

const stringToHex = (str) => {
  let val = "";
  for (let i = 0; i < str.length; i++) {
    if (val == "") {
      val = str.charCodeAt(i).toString(16);
    } else {
      val += str.charCodeAt(i).toString(16);
    }
  }
  return val;
}

const hexToString = (str) => {
  if (str.length % 2 !== 0) {
    console.log('Not a hex');
    return ""
  }
  let val = "";
  for (let i = 0; i < str.length; i += 2) {
    const n = parseInt(str[i] + str[i + 1], 16)
    val += String.fromCharCode(n);
  }
  return val;
}

function randomString(e) {
  e = e || 32;
  var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789",
    a = t.length,
    n = "";
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n
}

const format = (time) => {
  return moment(time).format("YYYY-MM-DD HH:mm:ss");
};

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.error("ERROR: " + reason);
  res.status(code || 500).json({ error: message });
}

function getTitle(content, len, word = 6) {
  if (content.length <= len) return content;
  let result = content;
  let index = result.indexOf("\n");
  if (index > word) {
    result = result.substring(0, index);
  }
  index = result.indexOf(".");
  if (index > word) {
    result = result.substring(0, index);
  }
  index = result.indexOf("。");
  if (index > word) {
    result = result.substring(0, index);
  }
  index = result.indexOf(",");
  if (index > word) {
    result = result.substring(0, index);
  }
  index = result.indexOf("，");
  if (index > word) {
    result = result.substring(0, index);
  }
  if (result.length > len) {
    if (result.indexOf(" ")) {
      let strs = result.split(" ");
      if (strs.length > word) {
        return strs.slice(0, word).join(" ");
      } else if (strs.length != 1) {
        return strs.join(" ");
      }
    }
  } else {
    return result;
  }
  return result.substring(0, len) + "...";
}

function getAccessTokenClient() {
  return new TwitterApi({
    appKey: process.env.CONSUMER_TOKEN,
    appSecret: process.env.CONSUMER_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
  });
}

module.exports = {
  b64uEnc,
  b64uDec,
  sleep,
  u8arryToHex,
  hexTou8array,
  format,
  handleError,
  stringToHex,
  hexToString,
  getTitle,
  sleep2,
  randomString,
  getAccessTokenClient
}

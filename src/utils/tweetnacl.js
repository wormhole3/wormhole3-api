const nacl = require('tweetnacl')
const { u8arryToHex, hexTou8array, b64uDec, hexToString } = require('./helper')
const { Send_Key_Private, Send_Key_Nonce } = require('../../config')

// encryp private key to a box use our private key and user's publicKey
// The sepcify user can open this box by his private key and our publicKey
const box = (msg, pubKey) => {
    pubKey = hexTou8array(pubKey)
    const myKey = hexTou8array(Send_Key_Private)
    const mdU8Array = nacl.box(hexTou8array(msg), hexTou8array(Send_Key_Nonce), pubKey, myKey)
    return u8arryToHex(mdU8Array)
}

// open ecrypt data from frontend
const openBox = (box, publicKey) => {
    box = hexTou8array(box);
    const nonce = hexTou8array(Send_Key_Nonce)
    const secret = hexTou8array(Send_Key_Private)
    publicKey = hexTou8array(publicKey)
    const res = nacl.box.open(box, nonce, publicKey, secret)
    return u8arryToHex(res)
}

module.exports = {
    box,
    openBox
}
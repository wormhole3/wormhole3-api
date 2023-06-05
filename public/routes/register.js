const express = require("express");
const router = express.Router();
const {
    setRegisterTicket,
} = require('../src/db/api/register')
const {
    handleError
} = require('../src/utils/helper')
const { box, openBox } = require("../src/utils/tweetnacl")

router.post('/cachePwd', async (req, res, next) => {
    try{
        let { ethAddress, pwd, publicKey } = req.body;
        pwd = openBox(pwd, publicKey)
        await setRegisterTicket(ethAddress, pwd)
        return res.status(200).json()
    }catch (e) {
        return handleError(res, e, 'Generate key fail')
    }
})

module.exports = router
const express = require("express");
const router = express.Router();
const ErrApi = require('../src/db/api/err')
const {
    handleError
} = require('../src/utils/helper')

router.post('/err', async (req, res) => {
    try {
        const { module, title, error } = req.body
        await ErrApi.insertError(module, title, error)
        return res.status(200)
    } catch (error) {
        return handleError(res, 'err', 'err')
    }
})

module.exports = router
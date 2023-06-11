var express = require('express');
var router = express.Router();
const { Client, auth } = require("twitter-api-sdk");
const { UserAuthKeyPre, TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, AuthErrCode, LoginPageUrl, REDIS_PWD, callback, ERR_CODE, TWITTER_REPLY_REDIS_KEY } = require('../config')
const { handleError, randomString } = require('../src/utils/helper')
const { get, set, del, rPush } = require('../src/db/redis')
const UserDB = require('../src/db/api/user')

const scopes = ["tweet.read", "users.read", "follows.read","space.read", "like.read"]

const authClient = new auth.OAuth2User({
    client_id: TWITTER_CLIENT_ID,
    client_secret: TWITTER_CLIENT_SECRET,
    callback,
    scopes,
})

/**
 * Register new account with nearId
 * This method will cache the near id and generate twitter auth link to frontend
 * It will return error code: 
 */
router.get('/register', async (req, res) => {
    try {
        const { nearId } = req.query;
        if (!nearId) {
            return handleError(res, 'Null param', 'Null param', ERR_CODE.PARAMS_ERROR);
        }
        const account = await UserDB.getAccountByNearId(nearId);
        if (account) {
            return handleError(res, 'Account registerd', 'Account registerd', ERR_CODE.USER_HAS_REGISTERED);
        }
        const state = randomString();
        await set(state, nearId);
        console.log(1111, state, nearId)
        const authUrl = authClient.generateAuthURL({
            state,
            code_challenge_method: "plain",
            code_challenge: "wormhole3_near"
        });
        return res.status(200).json({authUrl, nonce: state});
    }catch(e) {
        return handleError(res, e, 'login fail')
    }
})

router.get("/callback", async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error && error === 'access_denied') {
            return res.redirect(LoginPageUrl);
        }
        const nearId = await get(state)
        console.log(22, nearId, state);
        if (nearId) {
            const result = await authClient.requestAccessToken(code);
            const token = result.token;
            const userClient = new Client(token.access_token)
            const userInfo = await userClient.users.findMyUser({
                "user.fields": ["id", "name", "username", "profile_image_url", "verified", "public_metrics", "created_at"]
            });
            // store new bind account
            await UserDB.registerNewAccount(userInfo.data.id, userInfo.data.username, nearId, state);
            await del(state);
            res.redirect(LoginPageUrl + '?state=ok');
        }else{
            return res.redirect(LoginPageUrl);
        }
    } catch (error) { 
        console.log('Register call fail:', error);
        return res.redirect(LoginPageUrl);
    }
})

module.exports = router
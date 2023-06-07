var express = require('express');
var router = express.Router();
const { Client, auth } = require("twitter-api-sdk");
const { UserAuthKeyPre, TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, AuthErrCode, LoginPageUrl, REDIS_PWD, callback, ERR_CODE, TWITTER_REPLY_REDIS_KEY } = require('../config')
const { handleError, randomString } = require('../src/utils/helper')
const { get, set, del, rPush } = require('../src/db/redis')
const { ethers } = require('ethers')
const { checkTwitterAuth, checkEthSignature } = require('../src/utils/validator')
const { ulid } = require('ulid');

const scopes = ["tweet.read", "tweet.write", "users.read", "offline.access", "follows.read", "follows.write", "space.read", "like.read", "like.write"]
// cache register info 
// server will pop this info to register

const authClient = new auth.OAuth2User({
    client_id: TWITTER_CLIENT_ID,
    client_secret: TWITTER_CLIENT_SECRET,
    callback,
    scopes,
})

/**
 * Contain sign in and sign up method
 * this is just verify from twitter
 */
router.get('/login', async (req, res) => {
    try {
        const { needLogin } = req.query;
        const state = 'login' + ulid();
        if (needLogin) {
            await set(state, 'needLogin');
        }else {
            await set(state, 1);
        }
        const authUrl = authClient.generateAuthURL({
            state,
            code_challenge_method: "plain",
            code_challenge: "wormhole3"
        });
        return res.status(200).json(authUrl);
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
        const stateTemp = await get(state)
        if (stateTemp === 'needLogin') {
            const result = await authClient.requestAccessToken(code);
            const token = result.token;
            const userClient = new Client(token.access_token)
            const userInfo = await userClient.users.findMyUser({
                "user.fields": ["id", "name", "username", "profile_image_url", "verified", "public_metrics", "created_at"]
            });
            // cache auth info
            const loginInfo = {...token, twitterId: userInfo.data.id}
            if (userInfo.data.id === '1566641092959023104') {
                // wh3 replier
                await set(TWITTER_REPLY_REDIS_KEY, JSON.stringify(token), false)
            }
            await set(UserAuthKeyPre + userInfo.data.id, JSON.stringify(loginInfo), false);
            await set(state, JSON.stringify({...loginInfo, verified: userInfo.data.verified, ...userInfo.data.public_metrics, name: userInfo.data.name, username: userInfo.data.username, profileImg: userInfo.data.profile_image_url}));
            res.redirect(LoginPageUrl + '?state=' + state);
        }else if (stateTemp && parseInt(stateTemp) === 1) {
            const result = await authClient.requestAccessToken(code);
            const token = result.token;
            const userClient = new Client(token.access_token)
            const userInfo = await userClient.users.findMyUser({
                "user.fields": ["id", "name", "username", "profile_image_url", "verified", "public_metrics", "created_at"]
            });
            // cache auth info
            const loginInfo = {...token, twitterId: userInfo.data.id}
            if (userInfo.data.id === '1566641092959023104') {
                // wh3 replier
                await set(TWITTER_REPLY_REDIS_KEY, JSON.stringify(token), false)
            }
            await set(UserAuthKeyPre + userInfo.data.id, JSON.stringify(loginInfo), false);
            await set(state, JSON.stringify({...loginInfo, verified: userInfo.data.verified, ...userInfo.data.public_metrics, name: userInfo.data.name, username: userInfo.data.username, profileImg: userInfo.data.profile_image_url}));
            res.redirect(LoginPageUrl);
        }else{
            return res.redirect(LoginPageUrl);
        }
    } catch (error) { 
        console.log(311, error);
        return res.redirect(LoginPageUrl);
    }
})

/**
 * refresh the twitter access token of user
 */
router.post('/refresh', checkTwitterAuth, async(req, res) => {
    const { twitterId } = req.body;
    let userToken = await get(UserAuthKeyPre + twitterId);
    if (!userToken) {
        console.log('user token not exsit');
        return handleError(res, "AccessToken Invalid", "AccessToken Invalid", AuthErrCode.InvalidAccessToken)
    }
    userToken = JSON.parse(userToken);
    const userClient = new auth.OAuth2User({
        client_id: TWITTER_CLIENT_ID,
        client_secret: TWITTER_CLIENT_SECRET,
        callback,
        scopes,
        token: userToken
    })
    try {
        const newToken = await userClient.refreshAccessToken();
        await set(UserAuthKeyPre + twitterId, JSON.stringify(newToken.token), false);
        return res.status(200).json({accessToken: newToken.token.access_token, expiresAt: newToken.token.expires_at});
    }catch(e) {
        console.log('refresh new token fail:', e);
        return handleError(res, e, e, AuthErrCode.TokenExpired)
    }
})

router.get('/logout', async (req, res) => {
    const { twitterId } = req.query;
    let userToken = await get(UserAuthKeyPre + twitterId);
    if (!userToken) {
        console.log('user token not exsit');
        return res.status(200).json({});
    }
    userToken = JSON.parse(userToken);
    const userClient = new auth.OAuth2User({
        client_id: TWITTER_CLIENT_ID,
        client_secret: TWITTER_CLIENT_SECRET,
        callback,
        scopes,
        token: userToken
    })
    userClient.revokeAccessToken().then().catch();
    await del(UserAuthKeyPre + twitterId);
    res.status(200).json({});
})

module.exports = router
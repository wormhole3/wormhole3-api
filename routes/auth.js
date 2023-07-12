var express = require('express');
var router = express.Router();
const { TwitterApi } = require("twitter-api-v2");
const { UserAuthKeyPre, TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, AuthErrCode, LoginPageUrl, REDIS_PWD, callback, ERR_CODE, TWITTER_REPLY_REDIS_KEY } = require('../config')
const { handleError, randomString } = require('../src/utils/helper')
const { get, set, del, rPush } = require('../src/db/redis')
const UserDB = require('../src/db/api/user')

const scopes = ["tweet.read", "users.read", "follows.read", "space.read", "like.read", "offline.access"]

const client = new TwitterApi({ clientId: TWITTER_CLIENT_ID, clientSecret: TWITTER_CLIENT_SECRET });
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

        const { url, codeVerifier, state: resultState } = client.generateOAuth2AuthLink(callback, { scope: scopes, state });
        await set(state, JSON.stringify({ nearId, codeVerifier, state: resultState }));
        return res.status(200).json({ authUrl: url, nonce: state });
    } catch (e) {
        return handleError(res, e, 'login fail')
    }
})

router.get("/callback", async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error && error === 'access_denied') {
            console.log('user denied twitter login')
            return res.redirect(LoginPageUrl);
        }
        const user = JSON.parse(await get(state));
        console.log('receive twitter call back:', user);
        if (!user || !user.codeVerifier || !state || !user.state || !code) {
            return res.status(AuthErrCode.InvalidCode).send('You denied the app or your session expired!');
        }
        if (state !== user.state) {
            return res.status(AuthErrCode.InvalidState).send('Stored tokens didnt match!');
        }
        client.loginWithOAuth2({ code, codeVerifier: user.codeVerifier, redirectUri: callback })
            .then(async ({ client: loggedClient, accessToken, refreshToken, expiresIn }) => {
                const { data: userInfo } = await loggedClient.v2.me({
                    "user.fields": ["id", "name", "username", "profile_image_url", "verified", "public_metrics", "created_at"]
                });
                // console.log("accessToken:", accessToken);
                // console.log("refreshToken:", refreshToken);
                // console.log("expiresIn:", expiresIn);
                // console.log("userInfo:", userInfo);
                // console.log("================================");
                await UserDB.registerNewAccount(userInfo.id, userInfo.username, userInfo.name, userInfo.profile_image_url, user.nearId, state);
                req.session.regenerate(function () {
                    req.session.user = { state, nearId: user.nearId };
                });
                await set(state, JSON.stringify({ accessToken, refreshToken, nearId: user.nearId }));
                res.redirect(LoginPageUrl + '?state=ok');
            })
            .catch((e) => {
                console.log("loginWithOAuth2 error:", e);
                return res.status(AuthErrCode.InvalidVerifier).send('Invalid verifier or access tokens!')
            });
    } catch (error) {
        console.log('Register call fail:', error);
        return res.redirect(LoginPageUrl);
    }
});

router.get("/getToken", async (req, res) => {
    const { user } = req.session;
    const { nonce } = req.query;
    if (user && nonce) {
        let data = null;
        try {
            data = JSON.parse(await get(nonce));
        } catch (e) {
            return handleError(res, 'Invalid State', 'Invalid State', AuthErrCode.InvalidState);
        }
        let { state, nearId } = user;
        const { accessToken, refreshToken } = data;
        if (state === nonce && nearId === data.nearId) {
            await del(state);
            return res.status(200).json({ accessToken, refreshToken, nearId });
        }
    }
    return handleError(res, 'Invalid State', 'Invalid State', AuthErrCode.InvalidState);
});

router.get("/refresh", async (req, res) => {
    const { user } = req.session;
    const { refreshToken } = req.query;
    if (user && refreshToken) {
        try {
            const { accessToken, refreshToken: newRefreshToken } = await client.refreshOAuth2Token(refreshToken);
            return res.status(200).json({ accessToken, refreshToken: newRefreshToken, nearId: user.nearId });
        } catch (e) {
            console.log("refresh error:", e);
            return handleError(res, 'Refresh OAuth2 Token Error', 'Refresh OAuth2 Token Error', AuthErrCode.RefreshOAuthErr);
        }
    }
    return handleError(res, 'Invalid State', 'Invalid State', AuthErrCode.InvalidState);
});

module.exports = router
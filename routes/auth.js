var express = require('express');
var router = express.Router();
const { TwitterApi } = require("twitter-api-v2");
const { UserAuthKeyPre, UserTokenExpireTime, TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, AuthErrCode, LoginPageUrl, REDIS_PWD, callback, ERR_CODE, TWITTER_REPLY_REDIS_KEY } = require('../config')
const { handleError, randomString } = require('../src/utils/helper')
const { get, set, del, rPush } = require('../src/db/redis')
const UserDB = require('../src/db/api/user')
const { checkState } = require('./utils')

const scopes = ["tweet.read", "tweet.write", "users.read", "offline.access", "follows.read", "follows.write", "space.read", "like.read", "like.write"]

const client = new TwitterApi({ clientId: TWITTER_CLIENT_ID, clientSecret: TWITTER_CLIENT_SECRET });
/**
 * Register new account with nearId or login with exists user
 * This method will cache the near id and generate twitter auth link to frontend
 * It will return error code: 
 */
router.get('/register', async (req, res) => {
    try {
        const { nearId } = req.query;
        if (!nearId) {
            return handleError(res, 'Null param', 'Null param', ERR_CODE.PARAMS_ERROR);
        }
        // const account = await UserDB.getAccountByNearId(nearId);
        // if (account) {
        //     return handleError(res, 'Account registerd', 'Account registerd', ERR_CODE.USER_HAS_REGISTERED);
        // }
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
                // check and update userinfo
                const storedUser = await UserDB.getAccountByTwitterId(userInfo.id);
                if (!storedUser) {
                    await UserDB.registerNewAccount(userInfo.id, userInfo.username, userInfo.name, userInfo.profile_image_url, user.nearId, state);
                }else {
                    await UserDB.updateAccount(userInfo.id, userInfo.name, userInfo.username, userInfo.profile_image_url)
                }
                await set(state, JSON.stringify({ twitterId: userInfo.id, twitterName: userInfo.name, twitterUsername: userInfo.username, profileImg: userInfo.profile_image_url, accessToken, refreshToken, expiresAt: Date.now() + expiresIn * 1000, nearId: user.nearId}), UserTokenExpireTime);
                res.redirect(LoginPageUrl);
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

router.post("/getUserInfo", checkState, async (req, res) => {
    const { state } = req.body;
    const data = await get(state);
    if (data) {
        return res.status(200).send(data);
    }else {
        return handleError(res, 'Invalid State', 'Invalid State', AuthErrCode.TokenExpired);
    }
});

router.post("/refresh", checkState, async (req, res) => {
    let { refreshToken, state } = req.body;
    if (refreshToken && state) {
        try {
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = await client.refreshOAuth2Token(refreshToken);
            // update user client
            const userClient = new TwitterApi(accessToken);
            const userInfo = await userClient.v2.me({
                "user.fields": ["id", "name", "username", "profile_image_url", "verified", "public_metrics", "created_at"]
            });
            await UserDB.updateAccount(userInfo.id, userInfo.name, userInfo.username, userInfo.profile_image_url)
            // update user info, expired in 2 hours
            await del(state);
            state = randomString();
            await set(state, JSON.stringify({ twitterId: userInfo.id, twitterName: userInfo.name, twitterUsername: userInfo.username, profileImg: userInfo.profile_image_url, accessToken, refreshToken: newRefreshToken, expiresAt: Date.now() + expiresIn * 1000 }), UserTokenExpireTime);
            return res.status(200).json({ nonce: state, twitterId: userInfo.id, twitterName: userInfo.name, twitterUsername: userInfo.username, profileImg: userInfo.profile_image_url, accessToken, refreshToken: newRefreshToken, expiresAt: Date.now() + expiresIn * 1000, state });
        } catch (e) {
            await del(state);
            console.log("refresh error:", e);
            return handleError(res, 'Refresh OAuth2 Token Error', 'Refresh OAuth2 Token Error', AuthErrCode.RefreshOAuthErr);
        }
    }
    return handleError(res, 'Invalid State', 'Invalid State', AuthErrCode.InvalidState);
});

module.exports = router
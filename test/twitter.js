const { TWITTER_V1_BEARER_TOKEN } = require('../config')
const twitter = require("twitter-api-v2");

function getRequestClient() {
    return new twitter.TwitterApi({
        appKey: process.env.CONSUMER_TOKEN,
        appSecret: process.env.CONSUMER_SECRET,
    });
}

function getUserClient(accessToken, accessSecret) {
    return new twitter.TwitterApi({
        appKey: process.env.CONSUMER_TOKEN,
        appSecret: process.env.CONSUMER_SECRET,
        accessToken,
        accessSecret,
    });
}

async function main() {
    console.log("keys:", process.env.CONSUMER_TOKEN, process.env.CONSUMER_SECRET)
    const clientWithoutUser = getRequestClient();
    const tokens = await clientWithoutUser.generateAuthLink('oob');
    console.log("tokens:", tokens);

    const userClient = getUserClient(process.env.ACCESS_TOKEN, process.env.ACCESS_TOKEN_SECRET);

    // // const userClient = await clientWithoutUser.appLogin();
    // // console.log("userClient:", userClient);

    const result = await userClient.v1.uploadMedia("./logo.png");
    return result;
}


main().then(console.log).catch(console.log).finally(() => {
    process.exit();
})
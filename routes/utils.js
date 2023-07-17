const { get, set } = require("../src/db/redis");
const { handleError } = require("../src/utils/helper");


function checkState(req, res, next) {
    const { state } = req.body;
    if (state) {
        get(state).then((value) => {
            if (value) {
                next();
                return;
            } else {
                return handleError(res, 'Invalid State', 'Invalid State', 401);
            }
        }).catch((e) => {
            console.log("checkState error:", e);
            return handleError(res, 'Invalid State', 'Invalid State', 401);
        });
    }else {
        return handleError(res, 'Invalid State', 'Invalid State', 402);
    }
}

module.exports = {
    checkState
}
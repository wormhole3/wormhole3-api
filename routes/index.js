var express = require('express');
var router = express.Router();
const { getAccessTokenClient, handleError, randomString } = require('../src/utils/helper')
const { ERR_CODE, UserTokenExpireTime } = require("../config");
const formidable = require("formidable");
const { checkState } = require("./utils");
const fs = require('fs');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/upload", checkState, async (req, res, next) => {
  let form = new formidable.IncomingForm();
  form.encoding = "utf-8";
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    console.debug("fields:", fields, files);
    const { twitterId } = fields;
    if (err) {
      console.log("Parse upload form failed", err);
      return handleError(res, err, err);
    }
    if (
      !files ||
      !files.file ||
      files.file.length == 0
    ) {
      const errMsg = "The file is empty!";
      return handleError(res, errMsg, errMsg);
    }
    if (!twitterId) {
      return handleError(res, "Invalid query params", "Invalid query params", ERR_CODE.INVALID_TWITTER_ID);
    }
    let file = files.file instanceof Array ? files.file[0] : files.file
    let localFilePath = file.filepath;
    console.debug("localFilePath: ", localFilePath, twitterId);

    const client = getAccessTokenClient();
    try {
      let mediaId = await client.v1.uploadMedia(localFilePath, { additionalOwners: twitterId, mimeType: file.mimetype });
      console.debug("mediaId:", mediaId);
      fs.unlinkSync(localFilePath);
      return res.status(200).json({ mediaId });
    } catch (e) {
      console.error("upload error:", e);
      return handleError(res, "upload failed", "upload failed", ERR_CODE.TWITTER_ERR);
    }
  });
});

module.exports = router;

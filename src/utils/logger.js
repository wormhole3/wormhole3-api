const log4js = require("log4js");

log4js.configure({
    appenders: {
        datafileout: {
            type: "dateFile", filename: "logs/api.log", pattern: ".yy-MM-dd"
        },
        consoleout: {
            type: "console",
            layout: { type: "colored" }
        }
    },
    categories: { default: { appenders: ["datafileout", "consoleout"], level: "debug" } }
});

const logger = log4js.getLogger();

module.exports = logger
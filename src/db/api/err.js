const { execute } = require("../pool");

async function insertError(module, title, error) {
    let sql = 'INSERT INTO sys_err (module, title, error) VALUES(?,?,?)';
    await execute(sql, [module, title, error])
}

module.exports = {
    insertError
}
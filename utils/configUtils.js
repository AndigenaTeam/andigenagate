const {existsSync, writeFileSync, mkdirSync} = require("fs");
const constants = require("./constants");
const {sendLog} = require("./logUtils");

module.exports = {
    createFoldersAndConfigs() {
        if (!existsSync(`./config.json`)) {
            writeFileSync(`./config.json`, Buffer.from(JSON.stringify(constants.DEFAULT_CONFIG, null, 2)).toString("utf-8"))
            sendLog('config utility').info(`config.json does not exist... creating default one for you :D`)
        }

        if (!existsSync(`./data/configs`)) {
            mkdirSync(`./data/configs`)
            sendLog('config utility').debug(`/data/configs directory does not exist... creating empty one for you :D`)
        }

        if (!existsSync(`./data/keys`)) {
            mkdirSync(`./data/keys`)
            sendLog('config utility').debug(`/data/keys directory does not exist... creating empty one for you :D`)
        }

        if (!existsSync(`./data/keys/auth`)) {
            mkdirSync(`./data/keys/auth`)
            sendLog('config utility').debug(`/data/keys/auth directory does not exist... creating empty one for you :D`)
        }

        if (!existsSync(`./data/configs/keys.json`)) {
            writeFileSync(`./data/configs/keys.json`, Buffer.from(JSON.stringify(constants.DEFAULT_KEYS_CONFIG, null, 2)).toString("utf-8"))
            sendLog('config utility').info(`keys.json does not exist... creating default one for you :D`)
        }

    }
}
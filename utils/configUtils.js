const {existsSync, writeFileSync, mkdirSync} = require("fs");
const constants = require("./constants");
const cfg = require('../config.json')
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

    },

    clientTypeFromClientId(clientId) {
        switch (clientId) {
            case constants.ClientType.Editor:
                return "EDITOR";
            case constants.ClientType.IOS:
                return "IOS";
            case constants.ClientType.Android:
                return "ANDROID";
            case constants.ClientType.PC:
                return "PC";
            case constants.ClientType.PS4:
                return "PS4";
            case constants.ClientType.Server:
                return "SERVER";
            case constants.ClientType.PS5:
                return "PS5";
            case constants.ClientType.CloudAndroid:
                return "CLOUD_ANDROID";
            case constants.ClientType.CloudIOS:
                return "CLOUD_IOS";
            case constants.ClientType.CloudTV:
                return "CLOUD_TV";
            case constants.ClientType.CloudWeb:
                return "CLOUD_WEB";
            case constants.ClientType.CloudPC:
                return "CLOUD_PC";
            case constants.ClientType.CloudMAC:
                return "CLOUD_MAC";
            case constants.ClientType.Cloud3rdPartyMobile:
                return "CLOUD_THIRD_PARTY_MOBILE";
            case constants.ClientType.Cloud3rdPartyPC:
                return "CLOUD_THIRD_PARTY_PC";

        }
    },

    getSceneFromSettings() {
        if (cfg.disableRegistration) {
            return constants.SceneType.Temple;
        } else {
            return constants.SceneType.Normal;
        }
    }
}
const express = require('express')
const {ActionType, statusCodes} = require('../utils/constants')
const cfg = require('../config.json')
const {clientTypeFromClientId, getSceneFromSettings} = require("../utils/configUtils");
const {readFileSync, existsSync} = require('fs')
const {sendLog} = require("../utils/logUtils");
const {getAccountById} = require("../managers/databaseManager");

module.exports = (function() {
    let miscr = express.Router()

    // hk4e-sdk-os.hoyoverse.com
    miscr.get(`/:platform/mdk/agreement/api/getAgreementInfos`, function (req, res) {
        return res.json({retcode: 0, message: "OK", data: {marketing_agreements: []}
        })
    })

    // hk4e-sdk-os.hoyoverse.com
    miscr.all(`/:platform/combo/granter/api/compareProtocolVersion`, function (req, res) {
        return res.json({retcode: 0, message: "OK", data:{modified: true, protocol:{id: 0, app_id: 4, language:" en", user_proto: "", priv_proto: "", major: 7, minimum: 0, create_time: "0", teenager_proto: "", third_proto: ""}}})
    })

    // api-account-os.hoyoverse.com
    miscr.all(`/account/risky/api/check`, function (req, res) {
        return res.json({retcode: 0, message: "OK", data: {id: "none", action: ActionType.NONE, geetest: null}})
    })

    // sdk-os-static.hoyoverse.com
    miscr.all(`/combo/box/api/config/sdk/combo`, function (req, res) {
        return res.json({retcode: 0, message: "OK", data: {vals:{disable_email_bind_skip: false, email_bind_remind_interval:"7", email_bind_remind: true}}})
    })

    // hk4e-sdk-os-static.hoyoverse.com
    miscr.get(`/:platform/combo/granter/api/getConfig`, function (req, res) {
        return res.json({retcode: 0, message: "OK", data: {protocol: true, qr_enabled: cfg.allowQRCodeLogin, log_level: "INFO", announce_url: "https://webstatic-sea.hoyoverse.com/hk4e/announcement/index.html?sdk_presentation_style=fullscreenu0026sdk_screen_transparent=trueu0026game_biz=hk4e_globalu0026auth_appid=announcementu0026game=hk4e#/", push_alias_type: 2, disable_ysdk_guard: cfg.advanced.disableYSDKGuard, enable_announce_pic_popup: cfg.advanced.enableAnnouncePicPopup}})
    })

    miscr.get(`/:platform/mdk/shield/api/loadConfig`, function (req, res) {
        return res.json({retcode: 0, message: "OK", data: {id: 6, game_key: `${req.query.game_key}`, client: `${clientTypeFromClientId(req.query.client)}`, identity: "I_IDENTITY", guest: cfg.allowGuestAccounts, "ignore_versions":"", "scene": `${getSceneFromSettings()}`, name: "原神海外", disable_regist: cfg.disableRegistration, enable_email_captcha: false, thirdparty: ["fb","tw"], disable_mmt: false, server_guest: cfg.allowGuestAccounts,thirdparty_ignore: {tw: "", fb: ""}, enable_ps_bind_account: false, thirdparty_login_configs: {tw: {token_type: "TK_GAME_TOKEN", game_token_expires_in: 604800}, fb: {token_type: "TK_GAME_TOKEN", game_token_expires_in: 604800}}}})
    })

    // abtest-api-data-sg.hoyoverse.com
    miscr.all(`/data_abtest_api/config/experiment/list`, function (req, res) {
        return res.json({"retcode":0,"success":true,"message":"","data":[{"code":1000,"type":2,"config_id":"14","period_id":"6036_99","version":"1","configs":{"cardType":"old"}}]})
    })

    // /perf/config/verify?device_id=xxx&platform=x&name=xxx
    miscr.all(`/perf/config/verify`, function (req, res) {
        return res.json({code: 0})
    })

    // webstatic-sea.hoyoverse.com
    miscr.get(`/admin/mi18n/:platform/:path/:langfile.json`, function (req, res) {
        if (!existsSync(`./data/languages/${req.params.path}`)) return res.json({retcode: statusCodes.error.FAIL, message: "An error occured looking for path you specified!"})
        return res.send(readFileSync(`./data/languages/${req.params.path}/${process.env.ENV === "dev" ? "en" : req.params.langfile}.json`, {encoding: "utf-8"}))
    })

    miscr.get(`/upload/static-resource/2022/01/11/:file`, function (req, res) {
        if (!existsSync(`./data/images/${req.params.file}`)) return res.json({retcode: statusCodes.error.FAIL, message: "An error occured looking for path you specified!"})
        res.sendFile(`./data/images/${req.params.file}`)
    })

    // ==============================================================================
    //                              CUSTOM ROUTE
    //                            weedwacker compatibility
    // ==============================================================================

    miscr.get(`/extensions/combo/verify`, async function (req, res) {
        try {
            sendLog('/extensions/combo/verify').debug(JSON.stringify({uid: req.query.uid, combo_token: req.query.combo_token}))
            if (!cfg.advanced.weedWackerCompatibility) return res.json({retcode: statusCodes.error.FAIL, message: "WeedWacker login support is not enabled!"})
            if (!req.query.uid || !req.query.combo_token) return res.sendStatus(401)
            let account = await getAccountById(`${req.query.uid}`)
            if (account === null || account.session_token !== req.query.combo_token) return res.sendStatus(401)

            sendLog(`Gate WeedWacker Compatibility`).info((pass) ? `Account with uid ${req.query.uid} passed weedwacker login.` : `Account with uid ${req.query.uid} failed weedwacker login.`)
            res.sendStatus(200)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    // ==============================================================================
    //                                 NOTICES
    //                               Gate preview
    // ==============================================================================

    miscr.get(`/hk4e/announcement/index.html`, async function (req, res) {
        try {
            res.status(200).send(`announcement html lol`)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    return miscr;
})()
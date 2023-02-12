const express = require('express')
const {ActionType} = require('../utils/constants')

module.exports = (function() {
    let miscr = express.Router()

    // hk4e-sdk-os.hoyoverse.com
    miscr.get(`/hk4e_global/mdk/agreement/api/getAgreementInfos`, function (req, res) {
        return res.json({retcode: 0, message: "OK", data: {marketing_agreements:[]}
        })
    })

    // hk4e-sdk-os.hoyoverse.com
    miscr.all(`/hk4e_global/combo/granter/api/compareProtocolVersion`, function (req, res) {
        return res.json({"retcode":0,"message":"OK","data":{"modified":true,"protocol":{"id":0,"app_id":4,"language":"en","user_proto":"","priv_proto":"","major":7,"minimum":0,"create_time":"0","teenager_proto":"","third_proto":""}}})
    })

    // api-account-os.hoyoverse.com
    miscr.all(`/account/risky/api/check`, function (req, res) {
        return res.json({retcode:0,message:"OK",data:{id:"none",action:ActionType.NONE,geetest:null}})
    })

    // sdk-os-static.hoyoverse.com
    miscr.all(`/combo/box/api/config/sdk/combo`, function (req, res) {
        return res.json({retcode:0,message:"OK","data":{vals:{disable_email_bind_skip:false,email_bind_remind_interval:"7",email_bind_remind:true}}})
    })

    // hk4e-sdk-os-static.hoyoverse.com
    miscr.get(`/hk4e_global/combo/granter/api/getConfig`, function (req, res) {
        return res.json({"retcode":0,"message":"OK","data":{"protocol":true,"qr_enabled":false,"log_level":"INFO","announce_url":"https://webstatic-sea.hoyoverse.com/hk4e/announcement/index.html?sdk_presentation_style=fullscreenu0026sdk_screen_transparent=trueu0026game_biz=hk4e_globalu0026auth_appid=announcementu0026game=hk4e#/","push_alias_type":2,"disable_ysdk_guard":false,"enable_announce_pic_popup":true}})
    })

    miscr.get(`/hk4e_global/mdk/shield/api/loadConfig`, function (req, res) {
        return res.json({"retcode":0,"message":"OK","data":{"id":6,"game_key":"hk4e_global","client":"PC","identity":"I_IDENTITY","guest":false,"ignore_versions":"","scene":"S_NORMAL","name":"原神海外","disable_regist":false,"enable_email_captcha":false,"thirdparty":["fb","tw"],"disable_mmt":false,"server_guest":false,"thirdparty_ignore":{"tw":"","fb":""},"enable_ps_bind_account":false,"thirdparty_login_configs":{"tw":{"token_type":"TK_GAME_TOKEN","game_token_expires_in":604800},"fb":{"token_type":"TK_GAME_TOKEN","game_token_expires_in":604800}}}})
    })

    // abtest-api-data-sg.hoyoverse.com
    miscr.all(`/data_abtest_api/config/experiment/list`, function (req, res) {
        return res.json({"retcode":0,"success":true,"message":"","data":[{"code":1000,"type":2,"config_id":"14","period_id":"6036_99","version":"1","configs":{"cardType":"old"}}]})
    })

    // log-upload-os.mihoyo.com
    miscr.all(`/log/sdk/upload`, function (req, res) {
        console.log('/log/sdk/upload', req.body)
        return res.json({code: 0})
    })

    miscr.all(`/sdk/upload`, function (req, res) {
        console.log('/sdk/upload', req.body)
        return res.json({code: 0})
    })

    miscr.post(`/sdk/dataUpload`, function (req, res) {
        //console.log('/sdk/dataupload', req.body[0].uploadContent)
        return res.json({code: 0})
    })

    miscr.post(`/crash/dataUpload`, function (req, res) {
        console.log(`crash/dataupload`, req.body)
        return res.json({code: 0})
    })

    miscr.post(`/log`, function (req, res) {
        console.log(`/log`, req.body)
        return res.json({code: 0})
    })

    // /perf/config/verify?device_id=xxx&platform=x&name=xxx
    miscr.all(`/perf/config/verify`, function (req, res) {
        return res.json({code: 0})
    })

    // webstatic-sea.hoyoverse.com
    miscr.get(`/admin/mi18n/plat_oversea/*`, function (req, res) {
        return res.send(`your mom`)
    })

    return miscr;
})()
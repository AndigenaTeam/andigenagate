const express = require('express')
const cfg = require('../config.json')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const {statusCodes} = require('../utils/constants')
const crypto = require('crypto')

module.exports = (function() {
    let login = express.Router()

    // ==============================================================================
    //                              LOGIN ROUTE
    //                            username & password
    // ==============================================================================

    login.post(`/hk4e_global/mdk/shield/api/login`, async function (req, res) {
        try {
            const account = await dbm.getAccountByUsername(`${req.body.account}`)
            if (!account) return res.json({retcode: statusCodes.ERROR, message: "Account does not exist.", data: null})

            if (!account.email_verified) {
                let verifytoken = parseInt(Buffer.from(crypto.randomBytes(3)).toString("hex"), 16).toString().substring(0, 6)
                let reactivateticket = Buffer.from(crypto.randomUUID().replaceAll("-", '')).toString('hex')

                await dbm.updateAccountByUsername(`${req.body.account}`, `${verifytoken}`, `${reactivateticket}`)

                res.json({
                    retcode: statusCodes.success.RETCODE, message: "OK", data: {
                        device_grant_required: true,
                        safe_mobile_required: false,
                        realname_operation: "NONE",
                        realperson_required: false,
                        account: {
                            uid: `${account.account_id}`, name: `${account.username}`, email: `${account.email}`, mobile: "", is_email_verify: "0",
                            realname: "", identity_card: "", token: "", safe_mobile: "",
                            facebook_name: "", twitter_name: "", game_center_name: "", google_name: "",
                            apple_name: "", sony_name: "", tap_name: "", country: "US",
                            reactivate_ticket: `${reactivateticket}`, area_code: "**", device_grant_ticket: `${verifytoken}` }
                    }
                })
            } else {
                res.json({
                    retcode: statusCodes.success.RETCODE, message: "OK", data: {
                        device_grant_required: false,
                        safe_mobile_required: false,
                        realname_operation: "NONE",
                        realperson_required: false,
                        account: {
                            uid: `${account.account_id}`, name: `${account.username}`, email: `${account.email}`, mobile: "", is_email_verify: "1",
                            realname: "", identity_card: "", token: "", safe_mobile: "",
                            facebook_name: "", twitter_name: "", game_center_name: "", google_name: "",
                            apple_name: "", sony_name: "", tap_name: "", country: "US",
                            reactivate_ticket: `${account.session_token}`, area_code: "**", device_grant_ticket: "" }
                    }
                })
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                         cached token (registry)
    // ==============================================================================

    login.post(`/hk4e_global/mdk/shield/api/verify`, async function (req, res) {
        try {
            let account = await dbm.getAccountById(req.body.uid)
            if (!account) return res.json({retcode: statusCodes.ERROR, message: "Please login again.", data: null})

            if (!account.email_verified) {
                let verifytoken = parseInt(Buffer.from(crypto.randomBytes(3)).toString("hex"), 16).toString().substring(0, 6)
                let reactivateticket = Buffer.from(crypto.randomUUID().replaceAll("-", '')).toString('hex')

                await dbm.updateAccountById(`${req.body.uid}`, `${verifytoken}`, `${reactivateticket}`)

                res.json({
                    retcode: statusCodes.success.RETCODE, message: "OK", data: {
                        device_grant_required: true,
                        safe_mobile_required: false,
                        realname_operation: "NONE",
                        realperson_required: false,
                        account: {
                            uid: `${account.account_id}`, name: `${account.username}`, email: `${account.email}`, mobile: "", is_email_verify: "0",
                            realname: "", identity_card: "", token: "", safe_mobile: "",
                            facebook_name: "", twitter_name: "", game_center_name: "", google_name: "",
                            apple_name: "", sony_name: "", tap_name: "", country: "US",
                            reactivate_ticket: `${reactivateticket}`, area_code: "**", device_grant_ticket: `${verifytoken}` }
                    }
                })
            } else {
                res.json({
                    retcode: statusCodes.success.RETCODE, message: "OK", data: {
                        device_grant_required: false,
                        safe_mobile_required: false,
                        realname_operation: "NONE",
                        realperson_required: false,
                        account: {
                            uid: `${account.account_id}`, name: `${account.username}`, email: `${account.email}`, mobile: "", is_email_verify: "1",
                            realname: "", identity_card: "", token: "", safe_mobile: "",
                            facebook_name: "", twitter_name: "", game_center_name: "", google_name: "",
                            apple_name: "", sony_name: "", tap_name: "", country: "US",
                            reactivate_ticket: `${account.session_token}`, area_code: "**", device_grant_ticket: "" }
                    }
                })
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                        combo token (session key)
    // ==============================================================================

    login.post(`/hk4e_global/combo/granter/login/v2/login`, async function (req, res) {
        try {
            //TODO: parse actual token field and dont get stuck in "please login again loop"???
            console.log(req.body)

            let ldata = JSON.parse(req.body.data)
            //if (ldata.token === "") return res.json({retcode: statusCodes.ERROR, message: "Please login again."})

            let account = await dbm.getAccountById(`${ldata.uid}`)
            if (account.session_token !== "") {
                res.json({
                    retcode: statusCodes.success.RETCODE, message: "OK", data: {
                        account_type: "1",
                        heartbeat: false,
                        combo_id: 1,
                        combo_token: account.session_token,
                        open_id: `${ldata.uid}`,
                        data: JSON.stringify({guest: "false"}),
                        fatigue_remind: null
                    }
                })
            } /*else {
                await dbm.updateAccountById(ldata.uid, "", ldata.token)
                res.json({
                    retcode: statusCodes.success.RETCODE, message: "OK", data: {
                        account_type: "1",
                        heartbeat: false,
                        combo_id: 1,
                        combo_token: ldata.token,
                        open_id: `${ldata.uid}`,
                        data: JSON.stringify({guest: "false"}),
                        fatigue_remind: null
                    }
                })
            }*/

        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                           3rd party (popper)
    // ==============================================================================

    login.all(`/hk4e_global/mdk/shield/api/loginByThirdparty`, async function (req, res) {
        try {
            res.send("custom oauth2's ???? whentm")
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTES
    //                            external sources
    // ==============================================================================

    login.get(`/authentication/type`, function (req, res) {
        res.send(`AuthenticationSystem`)
    })

    login.post(`/authentication/login`, function (req, res) {

    })

    login.post(`/authentication/change_password`, function (req, res) {

    })

    login.get(`/authentication/openid/redirect`, function (req, res) {

    })

    // ==============================================================================
    //                              LOGIN ROUTES
    //                                  OAuth2
    // ==============================================================================

    // ==============================================================================
    //            twitter oauth2 is removed in 3.5+ due to twitter api going paid
    //                            handler for legacy purposes only
    // ==============================================================================

    login.get(`/sdkTwitterLogin.html`, async function (req, res) {
        try {
            if (cfg.socialLogin.twitter.enabled) {
                res.redirect(cfg.socialLogin.twitter.url)
            } else {
                res.send("not yet implemented")
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    login.get(`/Api/twitter_login`, function (req, res) {
        try {
            res.send("not yet implemented")
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    login.all(`/twitterLoginCallback`, async function (req, res) {
        try {
            res.send("not yet implemented")
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    login.get(`/sdkFacebookLogin.html`, async function (req, res) {
        try {
            if (cfg.socialLogin.facebook.enabled) {
                res.redirect(cfg.socialLogin.facebook.url)
            } else {
                res.send("not yet implemented")
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    return login;
})()
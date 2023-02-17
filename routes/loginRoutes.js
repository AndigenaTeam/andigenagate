const express = require('express')
const cfg = require('../config.json')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const {statusCodes} = require('../utils/constants')
const {validatePassword} = require('../managers/cryptManager')
const crypto = require('crypto')

module.exports = (function() {
    let login = express.Router()

    // ==============================================================================
    //                              LOGIN ROUTE
    //                            username & password
    // ==============================================================================

    login.post(`/:platform/mdk/shield/api/login`, async function (req, res) {
        try {
            sendLog('/api/login').debug(`${JSON.stringify(req.body)}`)
            let account = await dbm.getAccountByUsername(req.body.account)
            if (!account || account.login_method === 0) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Account does not exist.", data: null})
            if (cfg.verifyAccountPassword) {
                let validatedpass = await validatePassword(account.password, req.body.password)
                if (validatedpass === false) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Account password is invalid.", data: null})
            }

            let data = {
                device_grant_required: false,
                safe_mobile_required: false,
                realname_operation: "NONE",
                realperson_required: false,
                account: {
                    uid: `${account.account_id}`, name: `${account.username}`, email: `${account.email}`, mobile: "", is_email_verify: "0",
                    realname: "", identity_card: "", token: `${account.session_token}`, safe_mobile: "",
                    facebook_name: "", twitter_name: "", game_center_name: "", google_name: "",
                    apple_name: "", sony_name: "", tap_name: "", country: "US",
                    reactivate_ticket: "", area_code: "**", device_grant_ticket: "" }
            }

            if (cfg.verifyAccountEmail && !account.email_verified) {
                let verifytoken = parseInt(Buffer.from(crypto.randomBytes(3)).toString("hex"), 16).toString().substring(0, 6)

                await dbm.updateAccountByUsername(`${req.body.account}`, `${verifytoken}`)

                data.device_grant_required = true;
                data.account.device_grant_ticket = `${verifytoken}`;

                sendLog("Gate").info(`Account with username ${req.body.account} logged in successfully.`)
                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })

            } else if (!cfg.verifyAccountEmail ) {
                data.account.is_email_verify = "1";

                sendLog("Gate").info(`Account with username ${req.body.account} (platform: ${req.params.platform}) logged in successfully.`)
                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                         cached token (registry)
    // ==============================================================================

    login.post(`/:platform/mdk/shield/api/verify`, async function (req, res) {
        try {
            sendLog('/api/verify').debug(`${JSON.stringify(req.body)}`)
            let account = await dbm.getAccountById(req.body.uid, 1)
            if (!account || !req.body.token || !account.authorized_devices.includes(req.headers['x-rpc-device_id'])) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Game account cache information error."})

            let data = {
                device_grant_required: false,
                safe_mobile_required: false,
                realname_operation: "NONE",
                realperson_required: false,
                account: {
                    uid: `${account.account_id}`, name: `${account.username}`, email: `${account.email}`, mobile: "", is_email_verify: "1",
                    realname: "", identity_card: "", token: `${req.body.token}`, safe_mobile: "",
                    facebook_name: "", twitter_name: "", game_center_name: "", google_name: "",
                    apple_name: "", sony_name: "", tap_name: "", country: "US",
                    reactivate_ticket: "", area_code: "**", device_grant_ticket: "" }
            }

            res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                        combo token (session key)
    // ==============================================================================

    login.post(`/:platform/combo/granter/login/v2/login`, async function (req, res) {
        try {
            sendLog('/granter/v2/login').debug(`${JSON.stringify(req.body)}`)
            let ldata = JSON.parse(req.body.data)
            let account = await dbm.getAccountById(`${ldata.uid}`, (ldata.guest) ? 0 : 1)
            if (!account) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Game account cache information error."})
            let token = (!ldata.guest) ? Buffer.from(crypto.randomUUID().replaceAll("-", '')).toString('hex') : "guest"

            let data = {
                account_type: (!ldata.guest) ? "1" : "0",
                heartbeat: false,
                combo_id: 1,
                combo_token: token,
                open_id: `${ldata.uid}`,
                data: JSON.stringify({guest: (cfg.allowGuestAccounts)}),
                fatigue_remind: null
            }

            if (cfg.verifyAccountEmail && !ldata.guest) {
                await dbm.updateAccountById(`${ldata.uid}`, "", `${token}`)

                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })

            } else if (!cfg.verifyAccountEmail || ldata.guest) {
                await dbm.updateAccountById(`${ldata.uid}`, "", `${token}`)

                if (!account.authorized_devices.includes(req.body.device)) {
                   account.authorized_devices.push(req.body.device)
                    await dbm.updateAccountGrantDevicesById(ldata.uid, account.authorized_devices)
                } else {
                    await dbm.updateAccountGrantDevicesById(ldata.uid, account.authorized_devices)
                }

                sendLog("Gate").info(`${ldata.guest ? "Guest account" : "Account"} with UID ${ldata.uid} (platform: ${req.params.platform}) logged in successfully.`)
                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
            }

        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                               guest mode
    // ==============================================================================
    login.post(`/:platform/mdk/guest/guest/v2/login`, async function(req, res) {
        try {
            sendLog('/guest/v2/login').debug(`${JSON.stringify(req.body)}`)
            if (!cfg.allowGuestAccounts) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Guest accounts are not enabled!"})
            let account = await dbm.getAccountByDeviceId(req.body.device, 0)

            let data = {
                account_type: 0,
                guest_id: ""
            }

            if (!account) {
                let uid = Math.floor(1000 + Math.random() * 9000)
                let authd = []
                authd.push(req.body.device)
                await dbm.createAccount(uid, `${uid}`, `${uid}@guestaccount.com`, `Guest${uid}`, 0, true, "", authd)
                data.guest_id = `${uid}`

                res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: data})
            } else {
                data.guest_id = `${account.account_id}`
                res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: data})
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                           3rd party (pooper)
    // ==============================================================================

    login.all(`/:platform/mdk/shield/api/loginByThirdparty`, async function (req, res) {
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
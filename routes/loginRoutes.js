const express = require('express')
const cfg = require('../config.json')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const {statusCodes, ActionType, EMAIL_REGEX} = require('../utils/constants')
const {validatePassword, censorString, censorEmail} = require('../managers/cryptManager')
const crypto = require('crypto')
const superagent = require('superagent')

module.exports = (function() {
    let login = express.Router()

    // ==============================================================================
    //                              LOGIN ROUTE
    //                            username & password
    // ==============================================================================

    login.post(`/:platform/mdk/shield/api/login`, async function (req, res) {
        try {
            sendLog('/shield/api/login').debug(`${JSON.stringify(req.body)}`)
            let account = (EMAIL_REGEX.test(req.body.account)) ? await dbm.getAccountByEmail(req.body.account, 1) : await dbm.getAccountByUsername(req.body.account)
            if (account === null || account.login_method === 0) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Account does not exist.", data: null})
            let rnd = JSON.parse(JSON.stringify(account.realname))
            let bindrealname = ActionType.realname.NONE

            if (cfg.verifyAccountPassword) {
                let validatedpass = await validatePassword(account.password, req.body.password, true)
                if (validatedpass === false) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Account password is invalid.", data: null})
            }
            if (rnd.name === null || rnd.identity === null) {
                if (cfg.allowRealnameLogin) {
                    bindrealname = ActionType.realname.BIND_NAME
                } else {
                    bindrealname = ActionType.realname.NONE
                }
            }

            let data = {
                device_grant_required: false,
                safe_mobile_required: false,
                realname_operation: bindrealname,
                realperson_required: false,
                account: {
                    uid: `${account.account_id}`, name: `${censorString(account.username)}`, email: `${censorEmail(account.email)}`, mobile: "", is_email_verify: "0",
                    realname: "", identity_card: "", token: "", safe_mobile: "",
                    facebook_name: "", twitter_name: "", game_center_name: "", google_name: "",
                    apple_name: "", sony_name: "", tap_name: "", country: "US",
                    reactivate_ticket: "", area_code: "**", device_grant_ticket: "" }
            }

            if (cfg.verifyAccountEmail && !account.email_verified || !account.authorized_devices.includes(req.headers['x-rpc-device_id'])) {
                let ticket = Buffer.from(crypto.randomUUID().replaceAll("-", '')).toString('hex')
                await dbm.createDeviceGrant(ticket, 0, req.headers['x-rpc-device_id'], account.email)
                data.device_grant_required = true
                data.account.device_grant_ticket = `${ticket}`

                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
            } else if (!cfg.verifyAccountEmail || account.email_verified && account.realname.name !== null || account.realname.identity !== null) {
                data.account.is_email_verify = "1";
                data.account.token = `${account.session_token}`
                data.account.realname = `${account.realname.name}`
                data.account.identity_card = `${account.realname.identity}`

                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
            }

            sendLog("Gate").info(`Account with username ${req.body.account} (platform: ${req.params.platform}) logged in successfully.`)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                         cached token (registry)
    // ==============================================================================

    login.post(`/:platform/mdk/shield/api/verify`, async function (req, res) {
        try {
            sendLog('/shield/api/verify').debug(`${JSON.stringify(req.body)}`)
            let account = await dbm.getAccountById(req.body.uid)
            let bindrealname = ActionType.realname.NONE
            if (account === null || account.session_token !== req.body.token) return res.json({retcode: statusCodes.error.FAIL, message: "Game account cache information error."})
            let rnd = JSON.parse(JSON.stringify(account.realname))
            if (rnd.name === null || rnd.identity === null) {
                if (cfg.allowRealnameLogin) {
                    bindrealname = ActionType.realname.BIND_NAME
                } else {
                    bindrealname = ActionType.realname.NONE
                }
            }

            let data = {
                device_grant_required: false,
                safe_mobile_required: false,
                realname_operation: bindrealname,
                realperson_required: false,
                account: {
                    uid: `${account.account_id}`, name: `${censorString(account.username)}`, email: `${censorEmail(account.email)}`, mobile: "", is_email_verify: "0",
                    realname: "", identity_card: "", token: "", safe_mobile: "",
                    facebook_name: "", twitter_name: "", game_center_name: "", google_name: "",
                    apple_name: "", sony_name: "", tap_name: "", country: "US",
                    reactivate_ticket: "", area_code: "**", device_grant_ticket: "" }
            }

            if (!account.authorized_devices.includes(req.headers['x-rpc-device_id']) && account.email_verified || !account.authorized_devices.includes(req.headers['x-rpc-device_id']) && !account.email_verified) {
                let ticket = Buffer.from(crypto.randomUUID().replaceAll("-", '')).toString('hex')
                await dbm.createDeviceGrant(ticket, 0, req.headers['x-rpc-device_id'], account.email)
                data.device_grant_required = true
                data.account.device_grant_ticket = `${ticket}`

                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
            } else {
                data.account.token = `${req.body.token}`
                data.account.is_email_verify = "1"
                data.account.realname = `${account.realname.name}`
                data.account.identity_card = `${account.realname.identity}`
                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                        combo token (session key)
    // ==============================================================================

    login.post(`/:platform/combo/granter/login/v2/login`, async function (req, res) {
        try {
            sendLog('/granter/login/v2/login').debug(`${JSON.stringify(req.body)}`)
            let ldata = JSON.parse(req.body.data)
            let account = await dbm.getAccountById(`${ldata.uid}`)
            if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Account does not exist! Contact administrator if you think this is an issue."})
            if (account.session_token !== ldata.token) return res.json({retcode: statusCodes.error.FAIL, message: "Game account cache information error."})
            if (account.realname.name === null || account.realname.identity === null && cfg.allowRealnameLogin) return res.json({retcode: statusCodes.error.FAIL, message: "Account verification required."})
            let token = (!ldata.guest) ? ldata.token/*Buffer.from(crypto.randomUUID().replaceAll("-", '')).toString('hex')*/ : "guest"

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
                await dbm.updateAccountById(`${ldata.uid}`, `${token}`)

                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })

            } else if (!cfg.verifyAccountEmail || ldata.guest) {
                await dbm.updateAccountById(`${ldata.uid}`,`${token}`)
                await dbm.updateAccountGrantDevicesById(ldata.uid, account.authorized_devices)

                sendLog("Gate").info(`${ldata.guest ? "Guest account" : "Account"} with UID ${ldata.uid} (platform: ${req.params.platform}) logged in successfully.`)
                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
            }

        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
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

            if (account === null) {
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
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                           beforeVerify check
    // ==============================================================================

    login.post(`/:platform/combo/granter/login/beforeVerify`, async function (req, res) {
        try {
            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {is_heartbeat_required: false, is_realname_required: cfg.allowRealnameLogin, is_guardian_required: false}})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    // ==============================================================================
    //                              LOGIN ROUTE
    //                                 QRCode
    // ==============================================================================

    login.post(`/:platform/combo/panda/qrcode/fetch`, async function(req, res) {
        try {
            sendLog('/panda/qrcode/fetch').debug(JSON.stringify(req.body))
            if (!cfg.allowQRCodeLogin) return res.json({retcode: statusCodes.error.FAIL, message: "QRCode login is disabled!"})

            let url;
            let expires = new Date().setHours(1, 0, 0).toString()
            let ticket = Buffer.from(crypto.randomUUID().replaceAll("-", '')).toString('hex')
            if (cfg.socialLogin.discordQR.enabled) {
                url = cfg.socialLogin.discordQR.url
            } else {
                url = `http://${cfg.serverAddress}:${cfg.serverPort}/Api/login_by_qr`
            }

            await dbm.createQR(`${ticket}`, `${ActionType.qrode.INIT}`, `${req.body.device}`, `${expires}`)

            //console.log(`${url}?expire=${expires}\u0026ticket=${ticket}\u0026device=${req.body.device}`)
            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {url: `${url}?expire=${expires}\u0026ticket=${ticket}\u0026device=${req.body.device}`}})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    login.post(`/:platform/combo/panda/qrcode/query`, async function(req, res) {
        try {
            sendLog('/panda/qrcode/query').debug(JSON.stringify(req.body))
            let payload = {}
            if (!cfg.allowQRCodeLogin) return res.json({retcode: statusCodes.error.FAIL, message: "QRCode login is disabled!"})
            let qrd = await dbm.getQRByDeviceId(req.body.device, req.body.ticket)
            if (!qrd) return res.json({retcode: statusCodes.error.FAIL, message: "Ticket cache information error."})
            if (new Date(qrd.expires) < Date.now()) return res.json({retcode: statusCodes.error.LOGOUT_ERROR, message: `QRCode expired, generate a new one.`})

            if (qrd.state === ActionType.qrode.CONFIRMED) {
                let account = await dbm.getAccountByDeviceId(req.body.device, 2)
                if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Account does not exist!"})
                let rnd = JSON.parse(JSON.stringify(account.realname))

                if (!account.authorized_devices.includes(req.body.device)) {
                    account.authorized_devices.push(req.body.device)
                    await dbm.updateAccountGrantDevicesById(account.account_id, account.authorized_devices)
                }

                let token = Buffer.from(crypto.randomUUID().replaceAll("-", '')).toString('hex')
                await dbm.updateAccountById(account.account_id, token)
                await dbm.deleteQRByDeviceId(req.body.device, req.body.ticket)
                payload = {"proto": "Account",
                    "raw": JSON.stringify({"uid": `${account.account_id}`, "name": `${account.username}`, "email": `${account.email}`,
                        "is_email_verify": false, "realname": `${rnd.name}`, "identity_card": `${rnd.identity}`, "token": token, "country": "ZZ"}) }

            } else {
                payload = {}
            }

            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {stat: qrd.state, payload: payload }})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
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
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
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
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    login.get(`/sdkDiscordLogin.html`, async function (req, resp) {
        try {
            if(!req.session.token) {return resp.redirect(`${cfg.serverAddress}:${cfg.serverPort}/`)}

            await superagent.get(`https://discord.com/api/users/@me`)
                .set('authorization', `Bearer ${req.session.token}`)
                .end(async (err, res1) => {
                    if (err) return resp.redirect(`${cfg.serverAddress}:${cfg.serverPort}/`)
                    req.session.userid = res1.body.id
                    req.session.avatar = res1.body.avatar
                    let uid = cfg.advanced.uidPrefix + Math.floor(1000 + Math.random() * 9000).toString()
                    let paramsd = Buffer.from(`${req.query.data}`, 'base64').toString("utf-8")
                    let params = JSON.parse(paramsd)

                    if (req.session.userid) {
                        let account = await dbm.getAccountByEmail(`${res1.body.email}`, 2)
                        if (account === null) {
                            await dbm.createAccount(parseInt(uid), `${res1.body.username}#${res1.body.discriminator}`, `${res1.body.email}`, "", 2, true, "", [params.device])
                        }

                        resp.send(`<h2>You have successfully completed the login process, you can close this window and continue ingame.</h2>`)
                    } else {
                        resp.redirect(`${cfg.serverAddress}:${cfg.serverPort}/`)
                    }
                })
        } catch (e) {
            sendLog('Gate').error(e)
            resp.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    login.get(`/Api/twitter_login`, function (req, res) {
        try {
            res.send("not yet implemented")
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    login.all(`/twitterLoginCallback`, async function (req, res) {
        try {
            res.send("not yet implemented")
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
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
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    return login;
})()
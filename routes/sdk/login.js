const express = require('express')
const cfg = require('../../config.json')
const {sendLog} = require('../../utils/logUtils')
const dbm = require('../../managers/databaseManager')
const {statusCodes, ActionType, EMAIL_REGEX} = require('../../utils/constants')
const {validatePassword, censorString, censorEmail, generateToken, generateUid, encryptPassword} = require('../../managers/cryptManager')

module.exports = (function() {
    let login = express.Router()

    // ==============================================================================
    //                                   LOGIN
    //                            username & password
    // ==============================================================================

    login.post(`/:platform/mdk/shield/api/login`, async function (req, resp) {
        try {
            sendLog('/shield/api/login').debug(`${JSON.stringify(req.body)}`);

            let account = (EMAIL_REGEX.test(req.body.account)) ? await dbm.getAccountByEmail(req.body.account) : await dbm.getAccountByUsername(req.body.account);
            if (account === null || account.login_method === 0) return resp.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Account does not exist.", data: null});
            if (account.login_method === 2) return resp.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Please use QR code login.", data: null});

            let rnd = JSON.parse(JSON.stringify(account.realname))
            let bindrealname = ActionType.realname.NONE

            if (cfg.verifyAccountPassword) {
                let validatedpass = await validatePassword(account.password, req.body.password, true)
                if (validatedpass === false) return resp.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Account password is invalid.", data: null})
            }

            if (rnd.name === null || rnd.identity === null) {
                if (cfg.requireRealname) {
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
                let ticket = generateToken();
                data.device_grant_required = true;
                data.account.device_grant_ticket = `${ticket}`;

                resp.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data });
                await dbm.createDeviceGrant(ticket, 0, req.headers['x-rpc-device_id'], account.email);

            } else if (!cfg.verifyAccountEmail || account.email_verified && account.realname.name !== null || account.realname.identity !== null) {
                data.account.is_email_verify = "1";
                data.account.token = `${account.combo_token}`
                data.account.realname = `${account.realname.name}`
                data.account.identity_card = `${account.realname.identity}`

                resp.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
            }

            sendLog("Gate").info(`Account with UID ${account.account_id} (platform: ${req.params.platform}) logged in successfully.`)

        } catch (e) {
            sendLog('Gate').error(e)
            resp.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    // ==============================================================================
    //                                 LOGIN
    //                         cached token (registry)
    // ==============================================================================

    login.post(`/:platform/mdk/shield/api/verify`, async function (req, res) {
        try {
            sendLog('/shield/api/verify').debug(`${JSON.stringify(req.body)}`);

            let account = await dbm.getAccountById(req.body.uid);
            let bindrealname = ActionType.realname.NONE;
            if (account === null || account.combo_token !== req.body.token) return res.json({retcode: statusCodes.error.FAIL, message: "Game account cache information error."});

            let rnd = JSON.parse(JSON.stringify(account.realname));

            if (rnd.name === null || rnd.identity === null) {
                if (cfg.requireRealname) {
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
                let ticket= generateToken();
                await dbm.createDeviceGrant(ticket, 0, req.headers['x-rpc-device_id'], account.email);

                data.device_grant_required = true
                data.account.device_grant_ticket = `${ticket}`

                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data });

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
    //                                 LOGIN
    //                        combo token (session key)
    // ==============================================================================

    login.post(`/:platform/combo/granter/login/v2/login`, async function (req, res) {
        try {
            sendLog('/granter/login/v2/login').debug(`${JSON.stringify(req.body)}`);

            let ldata = JSON.parse(req.body.data);

            let account = await dbm.getAccountById(ldata.uid);
            if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Account does not exist! Contact administrator if you think this is an issue."});
            if (account.combo_token !== ldata.token && !ldata.guest) return res.json({retcode: statusCodes.error.FAIL, message: "Game account cache information error."});
            if (account.realname.name === null || account.realname.identity === null && cfg.requireRealname) return res.json({retcode: statusCodes.error.FAIL, message: "Account verification required."});

            let token = (ldata.guest) ? generateToken() : ldata.token;

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

                await dbm.updateAccountById(`${ldata.uid}`,`${token}`);
                await dbm.updateAccountDevicesById(ldata.uid, account.authorized_devices);

                sendLog("Gate").info(`${ldata.guest ? "Guest account" : "Account"} with UID ${ldata.uid} (platform: ${req.params.platform}) logged in successfully.`);

                res.json({ retcode: statusCodes.success.RETCODE, message: "OK", data: data })
            }

        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    // ==============================================================================
    //                                 LOGIN
    //                             guest accounts
    // ==============================================================================

    login.post(`/:platform/mdk/guest/guest/v2/login`, async function(req, res) {
        try {
            sendLog('/guest/v2/login').debug(`${JSON.stringify(req.body)}`);
            if (!cfg.allowGuestAccounts) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Guest accounts are not enabled!"});

            let account = await dbm.getAccountByDeviceId(req.body.device, 0);

            let data = {
                account_type: 0,
                guest_id: ""
            }

            if (account === null) {
                let uid = generateUid();
                let authd = []
                authd.push(req.body.device)
                await dbm.createAccount(parseInt(uid), `${uid}`, `${uid}@guestaccount.com`, `${await encryptPassword(`Guest${uid}`)}`, 0, true, "", authd)
                data.guest_id = `${uid}`

                res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: data});

            } else {
                data.guest_id = `${account.account_id}`;
                res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: data})
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    // ==============================================================================
    //                                 LOGIN
    //                               3rd party
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
    //                                 LOGIN
    //                            external sources
    // ==============================================================================

    login.post(`/authentication/login`, function (req, res) {

    })

    login.get(`/authentication/openid/redirect`, function (req, res) {

    })

    // ==============================================================================
    //                                 LOGIN
    //                              beforeVerify
    // ==============================================================================

    login.post(`/:platform/combo/granter/login/beforeVerify`, async function (req, res) {
        try {
            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {is_heartbeat_required: false, is_realname_required: cfg.allowRealnameLogin, is_guardian_required: false}})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    return login;
})()
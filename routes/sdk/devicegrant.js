const express = require('express')
const {sendLog} = require('../../utils/logUtils')
const dbm = require('../../managers/databaseManager')
const cfg = require('../../config.json')
const emailverifymsgs = require('../../data/configs/email_messages.json')
const {ActionType, preGrantWay, statusCodes} = require('../../utils/constants')
const {sendEmail} = require("../../managers/smtpManager")
const {generateToken, generateVerifyCode, encryptPassword, validatePassword, censorString, censorEmail} = require("../../managers/cryptManager");

module.exports = (function() {
    let pregrant = express.Router()

// ==============================================================================
//                                 DEVICE GRANT
//                            finalize verification
// ==============================================================================

    pregrant.post(`/account/device/api/grant`, async function(req, res) {
        try {
            let ticket = await dbm.getDeviceGrantByTicket(req.body.ticket);

            if (ticket === null) return res.json({retcode: statusCodes.error.FAIL, message: "Ticket cache infomation error!"});
            if (!await validatePassword(ticket.code, req.body.code, false)) return res.json({retcode: statusCodes.error.FAIL, message: "Invalid verification code!"});

            let newtoken = generateToken();
            await dbm.updateAccountEmailVerifyByEmail(ticket.email, true);

            let authdevices = await dbm.getAccountByEmail(ticket.email);

            await dbm.updateAccountById(authdevices.account_id, newtoken);

            if (!authdevices.authorized_devices.includes(req.headers["x-rpc-device_id"])) {
                authdevices.authorized_devices.push(req.headers["x-rpc-device_id"]);
                await dbm.updateAccountDevicesById(authdevices.account_id, authdevices.authorized_devices);
            }

            sendLog('Gate').info(`Account with UID ${authdevices.account_id} completed device grant.`);
            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {login_ticket: "", game_token: `${newtoken}`}})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 DEVICE GRANT
//                             request verification
// ==============================================================================

    pregrant.post(`/account/device/api/preGrantByTicket`, async function(req, res) {
        try {
            console.log('mraleee')
            switch (req.body.way) {
                case preGrantWay.WAY_EMAIL: {
                    console.log(req.body);
                    let ticket = await dbm.getDeviceGrantByTicket(req.body.action_ticket);
                    if (ticket === null) return res.json({retcode: statusCodes.error.FAIL, message: "Invalid ticket!"});

                    let account = await dbm.getAccountByEmail(ticket.email);
                    if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Account does not exist!"});

                    let verifycode = generateVerifyCode();
                    let vcenc = await encryptPassword(verifycode);

                    await dbm.updateAccountEmailVerifyByEmail(account.email, false);
                    await dbm.updateDeviceGrantByTicket(ticket.ticket, 1, vcenc);

                    let textformat = emailverifymsgs.text.replaceAll("%verifycode%", verifycode);
                    let htmlformat = emailverifymsgs.html.replaceAll("%verifycode%", verifycode);
                    await sendEmail(account.email, emailverifymsgs.subject, textformat, htmlformat)

                    sendLog('Gate').info(`Account with UID ${account.account_id} requested device grant.`);
                    res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {ticket: `${req.body.action_ticket}`}})
                }
                break;
                case preGrantWay.WAY_BINDMOBILE: {
                    let ticket = await dbm.getDeviceGrantByTicket(req.body.action_ticket);
                    if (ticket === null) return res.json({retcode: statusCodes.error.FAIL, message: "Invalid ticket!"});

                    let account = await dbm.getAccountByEmail(ticket.email);
                    if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Account does not exist!"});

                    await dbm.updateAccountEmailVerifyByEmail(account.email, false);

                    let verifycode = generateVerifyCode();
                    let vcenc = await encryptPassword(verifycode);

                    await dbm.updateDeviceGrantByTicket(ticket.ticket, 1, vcenc);

                    let textformat = emailverifymsgs.text.replaceAll("%verifycode%", verifycode);
                    let htmlformat = emailverifymsgs.html.replaceAll("%verifycode%", verifycode);
                    await sendEmail(account.email, emailverifymsgs.subject, textformat, htmlformat);

                    sendLog('Gate').info(`Account with UID ${account.account_id} requested device grant.`);
                    res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {ticket: `${req.body.action_ticket}`}})
                }
                break;
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 DEVICE GRANT
//                             realname verification
// ==============================================================================

    pregrant.post(`/:platform/mdk/shield/api/actionTicket`, async function(req, res) {
        try {
            sendLog('/shield/api/actionTicket').debug(`${JSON.stringify(req.body)}`);

            let account = await dbm.getAccountById(req.body.account_id);
            if (account === null || !req.body.game_token) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Game cache information error."});
            if (!account.authorized_devices.includes(req.headers['x-rpc-device_id'])) return res.json({retcode: statusCodes.error.LOGOUT_FAILED, message: "Device grant required."});

            let ticket = generateToken();

            await dbm.updateAccountById(`${req.body.account_id}`, `${req.body.game_token}`);

            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {ticket: `${ticket}`}})
            await dbm.createDeviceGrant(ticket, 0, req.headers['x-rpc-device_id'], account.email);

            sendLog('Gate').info(`Account with UID ${account.account_id} completed required verification(s) check.`)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 DEVICE GRANT
//                                  bind email
// ==============================================================================

    pregrant.post(`/:platform/mdk/shield/api/emailCaptcha`, async function (req, res) {
        try {
            switch (req.body.action_type) {
                case ActionType.BIND_EMAIL: {
                    await dbm.updateAccountEmailVerifyByEmail(`${req.body.email}`, true)

                    sendLog('Gate').info(`Account with email ${req.body.email} (platform: ${req.params.platform}) was requested to bind their email address.`)
                    res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: null})
                }
                break;
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 DEVICE GRANT
//                           forgor what this does lmao
// ==============================================================================

    pregrant.post(`/:platform/mdk/shield/api/loginCaptcha`, async function (req, res) {
        try {
            return res.json({retcode: statusCodes.error.FAIL, message: "Not yet implemented!"})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 DEVICE GRANT
//                                bind realname
// ==============================================================================

    pregrant.post(`/account/auth/api/bindRealname`, async function (req, res) {
        try {
            sendLog('/api/bindRealname').debug(`${JSON.stringify(req.body)}`);

            let ticket = await dbm.getDeviceGrantByTicket(req.body.ticket);
            if (ticket === null) return res.json({retcode: statusCodes.error.FAIL, message: "Ticket cache information error."});

            let account = await dbm.getAccountByEmail(ticket.email);
            if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Game cache information error."});

            let rnd = JSON.parse(JSON.stringify(account.realname));
            if (rnd.name !== null && rnd.identity !== null) return res.json({retcode: statusCodes.error.FAIL, message: "Account already verified"});

            let realname = {
                name: req.body.realname,
                identity: req.body.identity,
                is_realperson: false,
                operation: (cfg.requireRealname) ? ActionType.realname.BIND_NAME : ActionType.realname.NONE
            }

            await dbm.updateAccountRealnameById(account.account_id, {name: realname.name, identity: realname.identity})

            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {
                account: {
                    uid: account.account_id, name: censorString(account.username), email: censorEmail(account.email), realname: realname.name, identity_card: realname.identity}
                }
            })

            sendLog('Gate').info(`Account with UID ${account.account_id} was requested to bind their realname.`);
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 DEVICE GRANT
//                              list newer devices
// ==============================================================================

    pregrant.all(`/account/device/api/listNewerDevices`, function (req, res) {
        //TODO: parse new device listing checks
        console.log(req.body, res.headers)
    })

    return pregrant;
})()
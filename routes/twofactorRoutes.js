const express = require('express')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const cfg = require('../config.json')
const emailverifymsgs = require('../data/configs/email_messages.json')
const {ActionType, preGrantWay, statusCodes} = require('../utils/constants')
const crypto = require('crypto')
const {sendEmail} = require("../managers/smtpManager")

module.exports = (function() {
    let pregrant = express.Router()

    pregrant.all(`/account/device/api/listNewerDevices`, function (req, res) {
        //TODO: parse new device listing checks
        console.log(req.body, res.headers)
    })

    pregrant.post(`/account/device/api/grant`, async function(req, res) {
        try {
            let ticket = await dbm.getDeviceGrantByTicket(req.body.ticket)
            if (ticket === null) return res.json({retcode: statusCodes.error.FAIL, message: "Ticket cache infomation error!"})
            if (ticket.code !== req.body.code) return res.json({retcode: statusCodes.error.FAIL, message: "Invalid verification code!"})

            let newtoken = Buffer.from(crypto.randomUUID().replaceAll('-', '')).toString("hex")
            await dbm.updateAccountVerifiedByEmail(ticket.email, true)
            let authdevices = await dbm.getAccountByEmail(ticket.email, 1)
            await dbm.updateAccountById(authdevices.account_id, "", newtoken)

            await dbm.deleteDeviceGrantByDeviceId(ticket.deviceId, req.body.ticket)

            if (!authdevices.authorized_devices.includes(req.headers["x-rpc-device_id"])) {
                authdevices.authorized_devices.push(req.headers["x-rpc-device_id"])
                await dbm.updateAccountGrantDevicesById(authdevices.account_id, authdevices.authorized_devices)
            } else {
                await dbm.updateAccountGrantDevicesById(authdevices.account_id, authdevices.authorized_devices)
            }

            sendLog('Gate').info(`Account with deviceId ${req.headers['x-rpc-device_id']} completed email verification check.`)
            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {login_ticket: "", game_token: `${newtoken}`}})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    pregrant.post(`/account/device/api/preGrantByTicket`, async function(req, res) {
        try {
            switch (req.body.way) {
                case preGrantWay.WAY_EMAIL: {
                    console.log(req.body)
                    let ticket = await dbm.getDeviceGrantByTicket(req.body.action_ticket)
                    if (ticket === null) return res.json({retcode: statusCodes.error.FAIL, message: "Invalid ticket!"})
                    let account = await dbm.getAccountByEmail(ticket.email, 1)
                    if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Account does not exist!"})
                    await dbm.updateAccountVerifiedByEmail(account.email, false)

                    let verifytoken = parseInt(Buffer.from(crypto.randomBytes(3)).toString("hex"), 16).toString().substring(0, 6)
                    await dbm.updateDeviceGrantByTicket(ticket.ticket, 1, verifytoken)
                    let textformat = emailverifymsgs.text.replaceAll("%verifycode%", verifytoken)
                    let htmlformat = emailverifymsgs.html.replaceAll("%verifycode%", verifytoken)
                    await sendEmail(account.email, emailverifymsgs.subject, textformat, htmlformat)

                    sendLog('Gate').info(`Account with deviceId ${req.body.device.device_id} requested email verification code.`)
                    res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {ticket: `${req.body.action_ticket}`}})
                }
                break;
                case preGrantWay.WAY_BINDMOBILE: {
                    let ticket = await dbm.getDeviceGrantByTicket(req.body.action_ticket)
                    if (ticket === null) return res.json({retcode: statusCodes.error.FAIL, message: "Invalid ticket!"})
                    let account = await dbm.getAccountByEmail(ticket.email, 1)
                    if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Account does not exist!"})
                    await dbm.updateAccountVerifiedByEmail(account.email, false)

                    let verifytoken = parseInt(Buffer.from(crypto.randomBytes(3)).toString("hex"), 16).toString().substring(0, 6)
                    await dbm.updateDeviceGrantByTicket(ticket.ticket, 1, verifytoken)
                    let textformat = emailverifymsgs.text.replaceAll("%verifycode%", verifytoken)
                    let htmlformat = emailverifymsgs.html.replaceAll("%verifycode%", verifytoken)
                    await sendEmail(account.email, emailverifymsgs.subject, textformat, htmlformat)

                    sendLog('Gate').info(`Account with deviceId ${req.body.device.device_id} requested email verification code.`)
                    res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {ticket: `${req.body.action_ticket}`}})
                }
                break;
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    pregrant.post(`/:platform/mdk/shield/api/actionTicket`, async function(req, res) {
        try {
            sendLog('/shield/api/actionTicket').debug(`${JSON.stringify(req.body)}`)
            let account = await dbm.getAccountById(req.body.account_id)
            if (account === null || !req.body.game_token) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Game cache information error."})
            if (!account.authorized_devices.includes(req.headers['x-rpc-device_id'])) return res.json({retcode: statusCodes.error.LOGOUT_FAILED, message: "Device grant required."})
            let ticket = Buffer.from(crypto.randomUUID().replaceAll("-", '')).toString('hex')

            await dbm.createDeviceGrant(ticket, 0, req.headers['x-rpc-device_id'], account.email)
            await dbm.updateAccountById(`${req.body.account_id}`, `${req.body.game_token}`)

            sendLog('Gate').info(`Account with deviceId ${req.headers['x-rpc-device_id']} completed required verification(s) check.`)
            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {ticket: `${ticket}`}})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    pregrant.post(`/:platform/mdk/shield/api/emailCaptcha`, async function (req, res) {
        try {
            switch (req.body.action_type) {
                case ActionType.BIND_EMAIL: {
                    await dbm.updateAccountVerifiedByEmail(`${req.body.email}`, true)

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

    pregrant.post(`/:platform/mdk/shield/api/loginCaptcha`, async function (req, res) {
        try {
            return res.json({retcode: statusCodes.error.FAIL, message: "Not yet implemented!"})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    pregrant.post(`/account/auth/api/bindRealname`, async function (req, res) {
        try {
            sendLog('/api/bindRealname').debug(`${JSON.stringify(req.body)}`)
            let ticket = await dbm.getDeviceGrantByTicket(`${req.body.ticket}`)
            if (ticket === null) return res.json({retcode: statusCodes.error.FAIL, message: "Ticket cache information error."})
            let account = await dbm.getAccountByEmail(ticket.email, 1)
            if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Game cache information error."})
            let rnd = JSON.parse(JSON.stringify(account.realname))
            if (rnd.name !== null && rnd.identity !== null) return res.json({retcode: statusCodes.error.FAIL, message: "Account already verified"})

            let realname = {
                name: req.body.realname,
                identity: req.body.identity,
                is_realperson: false,
                operation: (cfg.allowRealnameLogin) ? ActionType.realname.BIND_NAME : ActionType.realname.NONE
            }

            await dbm.deleteDeviceGrantByDeviceId(req.headers['x-rpc-device_id'], req.body.ticket)
            await dbm.updateAccountRealnameById(account.account_id, {name: realname.name, identity: realname.identity})

            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {account: {
                        uid: account.account_id, name: account.username, email: account.email, realname: realname.name, identity_card: realname.identity}
                }})
            sendLog('Gate').info(`Account with deviceId ${req.headers['x-rpc-device_id']} was requested to bind their realname.`)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    return pregrant;
})()
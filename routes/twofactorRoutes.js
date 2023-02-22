const express = require('express')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const {validatePassword, encryptPassword} = require('../managers/cryptManager')
const cfg = require('../config.json')
const {ActionType, preGrantWay, statusCodes} = require('../utils/constants')
const crypto = require('crypto')

module.exports = (function() {
    let pregrant = express.Router()

    pregrant.all(`/account/device/api/listNewerDevices`, function (req, res) {
        //TODO: parse new device listing checks
        console.log(req.body, res.headers)
    })

    pregrant.post(`/account/device/api/grant`, async function(req, res) {
        try {
            if (await validatePassword(req.body.code, req.body.ticket, false)) return res.json({retcode: statusCodes.ERROR, message: "Invalid verification code."})
            let newtoken = Buffer.from(crypto.randomUUID().replaceAll('-', '')).toString("hex")
            await dbm.updateAccountByGrantTicket(req.body.ticket, true)
            let authdevices = await dbm.getAccountByGrantTicket(req.body.ticket, 1)
            await dbm.updateAccountSessionTokenByGrantTicket(req.body.ticket, newtoken)

            if (!authdevices.authorized_devices.includes(req.headers["x-rpc-device_id"])) {
                authdevices.authorized_devices.push(req.headers["x-rpc-device_id"])
                await dbm.updateAccountGrantDevicesByGrantTicket(req.body.ticket, authdevices.authorized_devices)
            } else {
                await dbm.updateAccountGrantDevicesByGrantTicket(req.body.ticket, authdevices.authorized_devices)
            }

            sendLog('gate').info(`Account with deviceId ${req.headers['x-rpc-device_id']} completed email verification check.`)
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
                    await dbm.updateAccountByGrantTicket(req.body.action_ticket, false)

                    sendLog('gate').info(`Account with deviceId ${req.body.device.device_id} requested email verification code.`)
                    res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {ticket: `${req.body.action_ticket}`}})
                }
                break;
                case preGrantWay.WAY_BINDMOBILE: {
                    await dbm.updateAccountByGrantTicket(req.body.action_ticket, false)

                    sendLog('gate').info(`Account with deviceId ${req.body.device.device_id} requested email verification code.`)
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
            console.log('/api/actionTicket', req.body)
            let account = await dbm.getAccountById(req.body.account_id, 1)
            if (!account) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Ticket cache information error."})
            if (!account.authorized_devices.includes(req.headers['x-rpc-device_id'])) return res.json({retcode: statusCodes.error.LOGIN_FAILED, message: "Game cache information error."})

            /*if (account.authorized_devices.includes(req.headers['x-rpc-device_id'])) {
                account.authorized_devices.push(req.headers["x-rpc-device_id"])
                await dbm.updateAccountGrantDevicesById(account.account_id, account.authorized_devices)
            }*/
            let verifytoken = await encryptPassword(parseInt(Buffer.from(crypto.randomBytes(3)).toString("hex"), 16).toString().substring(0, 6))

            await dbm.updateAccountById(account.account_id, verifytoken, req.body.game_token)
            sendLog('gate').info(`Account with deviceId ${req.headers['x-rpc-device_id']} completed required verification(s) check.`)
            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {ticket: `${verifytoken}`}})
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

                    sendLog('gate').info(`Account with email ${req.body.email} (platform: ${req.params.platform}) was requested to bind their email address.`)
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
            console.log('/auth/api/bindRealname', req.body)
            let account = await dbm.getAccountByGrantTicket(`${req.body.ticket}`)
            if (!account) return res.json({retcode: statusCodes.error.FAIL, message: "Ticket cache information error."})
            if (account.realname.name.length > 0 && account.realname.identity > 0) return res.json({retcode: statusCodes.error.FAIL, message: "Account already verified"})

            let realname = {
                name: req.body.realname,
                identity: req.body.identity,
                is_realperson: false,
                operation: (cfg.allowRealnameLogin) ? ActionType.realname.BIND_NAME : ActionType.realname.NONE
            }

            await dbm.updateAccountRealnameById(account.account_id, {name: realname.name, identity: realname.identity})

            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {account: {
                        uid: account.account_id, name: account.username, email: account.email, realname: realname.name, identity_card: realname.identity}
                }})
            sendLog('gate').info(`Account with ticket ${req.body.ticket} was requested to bind their realname.`)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    return pregrant;
})()
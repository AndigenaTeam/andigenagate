const express = require('express')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
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
            if (req.body.ticket !== req.body.code) return res.json({retcode: statusCodes.ERROR, message: "Invalid verification code."})
            await dbm.updateAccountByGrantTicket(req.body.ticket, true)
            let authdevices = await dbm.getAccountByGrantTicket(req.body.ticket)

            if (!authdevices.authorized_devices.includes(req.headers["x-rpc-device_id"])) {
                authdevices.authorized_devices.push(req.headers["x-rpc-device_id"])
                await dbm.updateAccountGrantDevices(req.body.ticket, authdevices.authorized_devices)
            } else {
                await dbm.updateAccountGrantDevices(req.body.ticket, authdevices.authorized_devices)
            }

            sendLog('gate').info(`Account with deviceFp ${req.headers['x-rpc-device_fp']} completed email verification check.`)
            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {login_ticket: "", game_token: `${Buffer.from(crypto.randomUUID().replaceAll('-', '')).toString("hex")}`}})
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    pregrant.post(`/account/device/api/preGrantByTicket`, async function(req, res) {
        try {
            switch (req.body.way) {
                case preGrantWay.WAY_EMAIL: {
                    await dbm.updateAccountByGrantTicket(req.body.action_ticket, false)
                    console.log('debug verify code', Buffer.from(req.body.action_ticket).toString("utf-8"))

                    sendLog('gate').info(`Account with deviceFp ${req.headers['x-rpc-device_fp']} requested email verification code.`)
                    res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {ticket: `${req.body.action_ticket}`}})
                }
                    break;
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    pregrant.post(`/hk4e_global/mdk/shield/api/emailCaptcha`, async function (req, res) {
        try {
            switch (req.body.action_type) {
                case ActionType.BIND_EMAIL: {
                    await dbm.updateAccountByEmail(`${req.body.email}`, true)

                    sendLog('gate').info(`Account with email ${req.body.email} was requested to bind their email address.`)
                    res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: null})
                }
                    break;
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }

    })

    return pregrant;
})()
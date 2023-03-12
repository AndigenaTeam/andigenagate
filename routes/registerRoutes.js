const express = require('express')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const crm = require('../managers/cryptManager')
const {statusCodes, ActionType} = require('../utils/constants')
const cfg = require('../config.json')
const crypto = require('crypto')
const {encryptPassword, validatePassword} = require("../managers/cryptManager");
const {updateAccountPasswordRstCodeById} = require("../managers/databaseManager");

module.exports = (function() {
    let reg = express.Router()

    reg.post(`/Api/regist_by_email`, async function (req, res) {
        try {
            sendLog('/Api/regist_by_email').debug(`${JSON.stringify({username: req.body.username, email: req.body.email})}`)
            if (req.body.email && req.body.password) {
                let uid = cfg.advanced.uidPrefix + Math.floor(1000 + Math.random() * 9000).toString()
                let token = Buffer.from(crypto.randomUUID().replaceAll('-', '')).toString("hex")
                let password = await crm.encryptPassword(req.body.password)

                await dbm.createAccount(parseInt(uid), `${req.body.username}`, `${req.body.email}`, `${password}`, 1, false, "", [])

                sendLog('gate').info(`Account with UID: ${uid} registered.`)
                res.json({code: statusCodes.success.WEB_STANDARD, data: {
                        account_info: {
                            account_id: uid, area_code:"**", country:"US", email:`${req.body.email}`, safe_level: 1, weblogin_token:`${token}`}, info: "", msg: "Success", status: statusCodes.success.REGISTER}})
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    reg.post(`/Api/forget_by_email`, async function (req, res) {
        try {
            sendLog('/Api/forget_by_email').debug(`${JSON.stringify({email: req.body.email})}`)
            if (req.body.email && req.body.state === ActionType.VERIFY_CODE_REQ) {
                let account = await dbm.getAccountByEmail(req.body.email)
                if (account === null) return res.json({code: statusCodes.error.FAIL, message: "Account with this email address does not exist!"})
                sendLog('Gate').info(`Account with email ${req.body.email} is requesting code to reset password.`)

                let verifycode = parseInt(Buffer.from(crypto.randomBytes(3)).toString("hex"), 16).toString().substring(0, 6)
                let vcenc = await encryptPassword(verifycode)
                await updateAccountPasswordRstCodeById(account.account_id, vcenc)
                console.log('debug forget password code', verifycode)

                res.json({code: statusCodes.success.WEB_STANDARD, data: {info: "forgetpassword_verifycodereq", msg: "Success"}})
            }

            if (req.body.state === ActionType.VERIFY_CODE_RESP) {
                let account = await dbm.getAccountByEmail(req.body.email)
                if (account === null) return res.json({code: statusCodes.error.FAIL, message: "Account with this email address does not exist!"})
                if (!await validatePassword(`${account.forget_ticket}`, `${req.body.code}`, false)) return res.json({code: statusCodes.error.FAIL, message: "Invalid verification code!"})

                sendLog('Gate').info(`Account with email ${req.body.email} is attempting to reset account password.`)
                res.json({code: statusCodes.success.WEB_STANDARD, data: {info: "forgetpassword_verifycoderesp", msg: "Success"}})
            }

            if (req.body.state === ActionType.RESET_PASSWORD) {
                let account = await dbm.getAccountByEmail(req.body.email)
                if (account === null) return res.json({code: statusCodes.error.FAIL, message: "Account with this email address does not exist!"})

                let token = Buffer.from(crypto.randomUUID().replaceAll('-', '')).toString("hex")
                let newPassword = await crm.encryptPassword(req.body.password)
                await dbm.updateAccountPasswordByEmail(req.body.email, newPassword)

                sendLog('Gate').info(`Account with email ${req.body.email} has changed password successfully.`)
                res.json({code: statusCodes.success.WEB_STANDARD, data: {account_info: {account_id: account.account_id, area_code: "**", country: "ZZ", email: `${account.email}`, safe_level: 1, weblogin_token: `${token}`}, info: "", msg: "Success", status: statusCodes.success.REGISTER}})
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    reg.get(`/Api/login_by_qr`, async function (req, res) {
        try {
            let qrd = await dbm.getQRByDeviceId(req.query.device)
            if (!qrd || new Date(qrd.expires) < Date.now() || qrd.state !== ActionType.qrode.INIT) return res.send(`<h3>Invalid request or QR code has expired. Please scan code displayed by game window again.</h3>`);

            await dbm.updateQRByDeviceId(req.query.device, req.body.ticket, ActionType.qrode.SCANNED)
            res.send(`<h1>By logging in you will authorize device displaying QR code to log in to your account.</h1>`)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    reg.post(`/Api/login_by_qr`, async function (req, res) {
        try {
            console.log(req.body)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    reg.get('/Api/create_mmt', async function(req, res) {
        res.json({code: statusCodes.error.FAIL})
    })

    reg.post(`/authentication/register`, function (req, res) {

    })

    return reg;
})()
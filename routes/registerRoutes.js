const express = require('express')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const crm = require('../managers/cryptManager')
const {statusCodes} = require('../utils/constants')
const cfg = require('../config.json')
const crypto = require('crypto')

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
            if (req.body.email) {
                let account = await dbm.getAccountByEmail(req.body.email)
                if (!account) return res.json({code: statusCodes.error.FAIL, message: "Account with this email address does not exist!"})
                sendLog('gate').info(`Account with email: ${req.body.email} is attempting to reset account password.`)

                // temp debug solution UI updated required...
                let token = Buffer.from(crypto.randomUUID().replaceAll('-', '')).toString("hex")
                let newPassword = await crm.encryptPassword("myNewPassword69")
                await dbm.updateAccountPasswordByEmail(req.body.email, newPassword)

                res.json({code: statusCodes.success.WEB_STANDARD, data: { account_info: {
                            account_id: `${account.account_id}`, area_code:"**", country:"US", email:`${req.body.email}`, safe_level: 1, weblogin_token:`${token}`}, info: "", msg: "Success", status: statusCodes.success.REGISTER}})
            }
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
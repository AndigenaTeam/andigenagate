const express = require('express')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const crm = require('../managers/cryptManager')
const keys = require('../data/configs/keys.json')
const {statusCodes} = require('../utils/constants')
const crypto = require('crypto')

module.exports = (function() {
    let reg = express.Router()

    reg.post(`/Api/regist_by_email`, async function (req, res) {
        try {
            sendLog('/Api/regist_by_email').debug(`${JSON.stringify({username: req.body.username, email: req.body.email})}`)
            if (req.body.email && req.body.password) {
                let uid = Math.floor(1000 + Math.random() * 9000)
                let token = Buffer.from(crypto.randomUUID().replaceAll('-', '')).toString("hex")
                let password = crm.encryptPassword(`${keys.signingKey}`, Buffer.from(req.body.password))

                await dbm.createAccount(uid, `${req.body.username}`, `${req.body.email}`, `${Buffer.from(password).toString("base64")}`, 1, false, "", [])

                sendLog('gate').info(`Account with UID: ${uid} registered.`)
                res.json({code: statusCodes.success.WEB_STANDARD, data: {
                        account_info: {
                            account_id: uid, area_code:"**", country:"US", email:`${req.body.email}`, safe_level: 1, weblogin_token:`${token}`}, info: "", msg: "Success", status: statusCodes.success.REGISTER}})
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    reg.post(`/Api/forget_by_email`, async function (req, res) {
        try {
            sendLog('/Api/forget_by_email').debug(`${JSON.stringify({email: req.body.email})}`)
            if (req.body.email) {

                sendLog('gate').info(`Account with email: ${req.body.email} is attempting to reset account password.`)
                res.json({code: statusCodes.success.WEB_STANDARD, data: { account_info: {
                            account_id: "", area_code:"**", country:"US", email:`${req.body.email}`, safe_level: 1, weblogin_token:""}, info: "", msg: "Success", status: statusCodes.success.REGISTER}})
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    reg.post(`/authentication/register`, function (req, res) {

    })

    return reg;
})()
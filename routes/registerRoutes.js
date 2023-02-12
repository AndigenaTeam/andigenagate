const express = require('express')
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const {statusCodes} = require('../utils/constants')
const crypto = require('crypto')

module.exports = (function() {
    let reg = express.Router()

    reg.post(`/Api/regist_by_email`, async function (req, res) {
        try {
            if (req.body.email && req.body.password) {
                let uid = Math.floor(1000 + Math.random() * 9000)
                let token = Buffer.from(crypto.randomUUID().replaceAll('-', '')).toString("hex")
                await dbm.createAccount(uid, `${req.body.username}`, `${req.body.email}`, `${req.body.password}`, false, "")

                sendLog('gate').info(`Account with UID: ${uid} registered.`)
                res.json({code: statusCodes.success.WEB_STANDARD, data: {
                        account_info: {
                            account_id: uid, area_code:"**", country:"US", email:`${req.body.email}`, safe_level: 1, weblogin_token:`${token}`}, info: "", msg: "Success", status: statusCodes.success.REGISTER}})
            }
        } catch (e) {
            sendLog('Gate').error(e)
        }
    })

    reg.post(`/authentication/register`, function (req, res) {

    })

    return reg;
})()
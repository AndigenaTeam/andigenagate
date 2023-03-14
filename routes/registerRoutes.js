const express = require('express')
const session = require('express-session')
const MemoryStore = require("memorystore")(session)
const cookieParser = require("cookie-parser")
const {sendLog} = require('../utils/logUtils')
const dbm = require('../managers/databaseManager')
const crm = require('../managers/cryptManager')
const {statusCodes, ActionType} = require('../utils/constants')
const cfg = require('../config.json')
const crypto = require('crypto')
const superagent = require('superagent')

module.exports = (function() {
    let reg = express.Router()
    reg.use(cookieParser());
    const oneDay = 1000 * 60 * 60 * 24;
    reg.use(session({
        store: new MemoryStore({checkPeriod: 86400000 }),
        secret: crypto.randomUUID().toString(),
        saveUninitialized: true,
        cookie: { maxAge: oneDay },
        resave: false
    }));

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
                let vcenc = await crm.encryptPassword(verifycode)
                await dbm.updateAccountPasswordRstCodeById(account.account_id, vcenc)
                console.log('debug forget password code', verifycode)

                res.json({code: statusCodes.success.WEB_STANDARD, data: {info: "forgetpassword_verifycodereq", msg: "Success"}})
            }

            if (req.body.state === ActionType.VERIFY_CODE_RESP) {
                let account = await dbm.getAccountByEmail(req.body.email)
                if (account === null) return res.json({code: statusCodes.error.FAIL, message: "Account with this email address does not exist!"})
                if (!await crm.validatePassword(`${account.forget_ticket}`, `${req.body.code}`, false)) return res.json({code: statusCodes.error.FAIL, message: "Invalid verification code!"})

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
            let qrd = await dbm.getQRByDeviceId(req.query.device, req.query.ticket)
            if (!qrd || new Date(qrd.expires) < Date.now() || qrd.state !== ActionType.qrode.INIT) return res.send(`<h3>Invalid request or QR code has expired. Please scan code displayed by game window again.</h3>`);

            await dbm.updateQRByDeviceId(req.query.device, req.query.ticket, ActionType.qrode.SCANNED)
            let params = Buffer.from(`${JSON.stringify({expire: qrd.expires, device: req.query.device, ticket: req.query.ticket})}`).toString("base64")
            res.redirect(`${process.env.DISCORD_OAUTH_BASE}?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${cfg.socialLogin.discordQR.callbackUrl}&response_type=code&scope=${process.env.DISCORD_OAUTH_SCOPES}&state=${params}`)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    reg.get(`/Api/login_by_qr/callback`, async function (req, resp) {
        try {
            const {code} = req.query
            if (!req.query.code) {
                return resp.send('No access code specified');
            }

            let paramsd = Buffer.from(`${req.query.state}`, 'base64').toString("utf-8")
            let params = JSON.parse(paramsd)

            let qrd = await dbm.getQRByDeviceId(params.device, params.ticket)
            if (!qrd || new Date(qrd.expires) < Date.now() || qrd.state !== ActionType.qrode.SCANNED) return resp.send(`<h3>Invalid request or QR code has expired. Please scan code displayed by game window again.</h3>`);

            await superagent.post(`https://discord.com/api/oauth2/token`)
                .send({
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: `${cfg.socialLogin.discordQR.callbackUrl}`,
                    scope: `${process.env.DISCORD_OAUTH_SCOPES}`
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .end(async (err, res) => {
                    await dbm.updateQRByDeviceId(params.device, params.ticket, ActionType.qrode.CONFIRMED)
                    if (err) res.redirect(`${cfg.serverAddress}:${cfg.serverPort}/`)
                    req.session.token = res.body.access_token;
                    resp.redirect(`/sdkDiscordLogin.html?data=${req.query.state}`)
                })
        } catch (e) {
            sendLog('Gate').error(e)
            resp.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
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
const express = require('express')
const session = require('express-session')
const MemoryStore = require("memorystore")(session)
const cookieParser = require("cookie-parser")
const {randomUUID} = require('crypto')
const dbm = require('../../managers/databaseManager')
const {sendLog} = require('../../utils/logUtils')
const {sendEmail} = require("../../managers/smtpManager");
const {statusCodes, ActionType} = require('../../utils/constants');
const {generateUid, encryptPassword, generateVerifyCode, generateToken, validatePassword} = require("../../managers/cryptManager");
const emailverifymsgs = require("../../data/configs/email_messages.json");
const cfg = require('../../config.json')

module.exports = (function() {
    let reg = express.Router();
    reg.use(cookieParser());
    reg.use(session({
        store: new MemoryStore({checkPeriod: 86400000 }),
        secret: randomUUID().toString(),
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 24 }, // one day
        resave: false
    }));

// ==============================================================================
//                                 REGISTER
//                            register an account
// ==============================================================================

    reg.post(`/Api/regist_by_email`, async function (req, res) {
        try {
            sendLog('/Api/regist_by_email').debug(`${JSON.stringify({username: req.body.username, email: req.body.email})}`);
            let account = await dbm.getAccountByEmail(req.body.email);
            if (account !== null) return res.json({retcode: statusCodes.error.FAIL, message: "Account with this email already exists."});

            if (req.body.email && req.body.password) {
                let password = await encryptPassword(req.body.password);
                let uid = generateUid();
                let token = generateToken();

                await dbm.createAccount(parseInt(uid), `${req.body.username}`, `${req.body.email}`, `${password}`, 1, (!cfg.verifyAccountEmail), token, []);

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

// ==============================================================================
//                                 FORGET
//                             password reset
// ==============================================================================

    reg.post(`/Api/forget_by_email`, async function (req, res) {
        try {
            sendLog('/Api/forget_by_email').debug(`${JSON.stringify({email: req.body.email})}`);

            if (req.body.email && req.body.state === ActionType.VERIFY_CODE_REQ) {
                let account = await dbm.getAccountByEmail(req.body.email);
                if (account === null) return res.json({code: statusCodes.error.FAIL, message: "Account with this email address does not exist!"});

                sendLog('Gate').info(`Account with email ${req.body.email} is requesting code to reset password.`)

                let verifycode= generateVerifyCode();
                let vcenc = await encryptPassword(verifycode);

                await dbm.updateAccountForgetTicketById(account.account_id, vcenc);

                let textformat = emailverifymsgs.text.replaceAll("%verifycode%", verifycode);
                let htmlformat = emailverifymsgs.html.replaceAll("%verifycode%", verifycode);
                await sendEmail(req.body.email, emailverfymsgs.subject, textformat, htmlformat);

                res.json({code: statusCodes.success.WEB_STANDARD, data: {info: "forgetpassword_verifycodereq", msg: "Success"}})
            }

            if (req.body.state === ActionType.VERIFY_CODE_RESP) {
                let account = await dbm.getAccountByEmail(req.body.email);

                if (account === null) return res.json({code: statusCodes.error.FAIL, message: "Account with this email address does not exist!"});
                if (!await validatePassword(`${account.forget_ticket}`, `${req.body.code}`, false)) return res.json({code: statusCodes.error.FAIL, message: "Invalid verification code!"});

                sendLog('Gate').info(`Account with email ${req.body.email} is attempting to reset account password.`)

                res.json({code: statusCodes.success.WEB_STANDARD, data: {info: "forgetpassword_verifycoderesp", msg: "Success"}})
            }

            if (req.body.state === ActionType.RESET_PASSWORD) {
                let account = await dbm.getAccountByEmail(req.body.email);

                if (account === null) return res.json({code: statusCodes.error.FAIL, message: "Account with this email address does not exist!"});

                let newPassword = await encryptPassword(req.body.password);

                await dbm.updateAccountPasswordByEmail(req.body.email, newPassword);

                sendLog('Gate').info(`Account with email ${req.body.email} has changed password successfully.`);
                res.json({code: statusCodes.success.WEB_STANDARD, data: {account_info: {account_id: account.account_id, area_code: "**", country: "ZZ", email: `${account.email}`, safe_level: 1, weblogin_token: `${generateToken()}`}, info: "", msg: "Success", status: statusCodes.success.REGISTER}})
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    reg.get(`/Api/twitter_login`, function (req, res) {
        try {
            res.send("not yet implemented")
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 REGISTER
//                             EXTERNAL DEVICES
// ==============================================================================

    reg.post(`/authentication/register`, function (req, res) {

    })

    reg.post(`/authentication/change_password`, function (req, res) {

    })

    return reg;
})()
const mongoose = require('mongoose')
const crypto = require('crypto')
const {sendLog} = require("../utils/logUtils")
const models = require('../utils/models')
const {ActionType} = require("../utils/constants");

const accmodel = new mongoose.model('accountModel', models.accountSchema(), 'account')
const rolemodel = new mongoose.model('roleModel', models.roleSchema(), 'roles')
const qrloginmodel = new mongoose.model("qrLoginModel", models.qrLoginSchema(), "qrdata")

module.exports = {
    connect(url = process.env.DB_URL) {
        mongoose.connect(`${url}`)
        const conn = mongoose.connection

        conn.on("connected", () => {
            sendLog("Database").info(`Database connection established!`)
            this.populateDatabaseDefaults().then(() => {})
        });

        conn.on("error", (err) => {
            sendLog("Database").error(err)
        });

        return conn;
    },

    populateDatabaseDefaults() {
        return new Promise(async (res, rej) => {
            rolemodel.countDocuments({name: 'admin'}, function (err, count) {
                if (err) return rej(err)
                if (count === 0) {
                    new rolemodel({role_id: `${crypto.randomInt(1000, 99999999)}`, name: `admin`, prefix: `&6[&cAdmin&6]&r `, created_by: `69`, permissions: [`*`]}).save(function (err) {
                        if (err) return rej(err)
                        sendLog('database').debug(`Creating default role "admin"...`)
                    })
                    new rolemodel({role_id: `00001`, name: `default`, prefix: ``, created_by: `69`, permissions: []}).save(function (err) {
                        if (err) return rej(err)
                        sendLog('database').debug(`Creating default role "default"...`)
                    })
                    sendLog("Database").info(`Populated default database entries successfully.`)
                }
            });
        })
    },

    // ===================== ACCOUNT =====================

    createAccount(accountId = 0, username = '', email = '', password = '', loginMethod = 1, emailVerified = false, sessionToken = "", authorizedDevices = []) {
        return new Promise(async (res, rej) => {
            new accmodel({
                account_id: `${accountId}`,
                username: `${username}`,
                email: `${email}`,
                password: `${password}`,
                banned: false,
                operator: false,
                login_method: loginMethod,
                last_version: "",
                role: "00001",
                email_verified: emailVerified,
                grant_ticket: "",
                forget_ticket: "",
                session_token: `${sessionToken}`,
                authorized_devices: authorizedDevices,
                realname: {name: null, identity: null},
        }).save(function (err, doc) {
            if (err) return rej(err)
                res(doc._id)
                sendLog('Database').info(`User ${username} (${accountId}) registered/created successfully.`)
            })
        })
    },

    getAccountByUsername(username = "") {
        return new Promise(async (res, rej) => {
            accmodel.findOne({username: `${username}`}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    getAccountById(accountId = "", loginMethod = 1) {
        return new Promise(async (res, rej) => {
            accmodel.findOne({account_id: `${accountId}`, login_method: loginMethod}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    getAccountByEmail(accountEmail = "") {
        return new Promise(async (res, rej) => {
            accmodel.findOne({email: `${accountEmail}`}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    getAccountByGrantTicket(grantTicket = "", loginMethod = 1) {
        return new Promise(async (res, rej) => {
            accmodel.findOne({grant_ticket: `${grantTicket}`, login_method: loginMethod}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    getAccountByDeviceId(deviceId = "", loginMethod = 0) {
        return new Promise(async (res, rej) => {
            accmodel.findOne({authorized_devices: `${deviceId}`, login_method: loginMethod}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountById(accountId = "", grantTicket = "", sessionToken = "") {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({account_id: `${accountId}`}, {session_token: `${sessionToken}`, grant_ticket: `${grantTicket}`}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountVerifiedByEmail(accountEmail = "", verifiedEmail = false) {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({email: `${accountEmail}`}, {email_verified: `${verifiedEmail}`}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountPasswordByEmail(accountEmail = "", newPassword = "") {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({email: `${accountEmail}`}, {password: newPassword}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountByUsername(accountUsername = "", grantTicket = "") {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({username: `${accountUsername}`}, {grant_ticket: `${grantTicket}`}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountByGrantTicket(grantTicket = "", emailVerified = false) {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({grant_ticket: `${grantTicket}`}, {email_verified: emailVerified}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountRealnameById(accountId = "", realName = {}) {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({account_id: `${accountId}`}, {realname: realName}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountGrantDevicesByGrantTicket(grantTicket = "", authorizedDevices = []) {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({grant_ticket: `${grantTicket}`}, {authorized_devices: authorizedDevices}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountGrantDevicesById(accountId = "", authorizedDevices = []) {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({account_id: `${accountId}`}, {authorized_devices: authorizedDevices}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountSessionTokenByGrantTicket(grantTicket = "", sessionToken = "") {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({grant_ticket: `${grantTicket}`}, {session_token: sessionToken}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateAccountPasswordRstCodeById(accountId, emailCode = "") {
        return new Promise(async (res, rej) => {
            accmodel.updateOne({account_id: `${accountId}`}, {forget_ticket: emailCode}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    // ===================== ROLES =====================

    createRole(roleName = "", rolePrefix = "", roleCreatorId = "69", rolePermissions = []) {
        return new Promise(async (res, rej) => {
            new rolemodel({
                role_id: `${crypto.randomInt(1000, 99999999)}`,
                name: `${roleName}`,
                prefix: `${rolePrefix}`,
                created_by: `${roleCreatorId}`,
                permissions: rolePermissions
            }).save(function (err, doc) {
                if (err) return rej(err)
                console.log('created')
                sendLog('Database').info(`Role ${roleName} (${doc.role_id}) created successfully.`)
            })
        })
    },

    getRoleByName(roleName = "") {
        return new Promise(async (res, rej) => {
            rolemodel.findOne({name: `${roleName}`}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    getRoleById(roleId = "") {
        return new Promise(async (res, rej) => {
            rolemodel.findOne({role_id: `${roleId}`}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    getRoleByCreator(creatorId = "") {
        return new Promise(async (res, rej) => {
            rolemodel.findOne({created_by: `${creatorId}`}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    // ===================== QRCODE LOGIN =====================

    createQR(ticket = "", state = ActionType.qrode.INIT, deviceId = "", expires = "") {
        return new Promise(async (res, rej) => {
            new qrloginmodel({
                ticket: ticket,
                state: state,
                deviceId: deviceId,
                expires: expires
            }).save(function (err, doc) {
                if (err) return rej(err)
                res(doc._id)
                console.log(doc)
                //sendLog('Database').info(`User ${username} (${accountId}) registered/created successfully.`)
            })
        })
    },

    getQRByDeviceId(deviceId, ticket) {
        return new Promise(async (res, rej) => {
            qrloginmodel.findOne({deviceId: `${deviceId}`, ticket: ticket}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },

    updateQRByDeviceId(deviceId = "", ticket = "", state = "") {
        return new Promise(async (res, rej) => {
            qrloginmodel.updateOne({deviceId: `${deviceId}`, ticket: ticket}, {state: state}, function (err, resp) {
                if (err) rej(err)
                res(resp)
            })
        })
    },
}
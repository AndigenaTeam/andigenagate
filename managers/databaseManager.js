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
            rolemodel.countDocuments({name: 'admin'}).then(count => {
                if (count === 0) {
                    new rolemodel({role_id: `${crypto.randomInt(1000, 99999999)}`, name: `admin`, prefix: `&6[&cAdmin&6]&r `, created_by: `69`, permissions: [`*`]}).save(function (err, doc) {
                        if (err) return rej(err)
                        sendLog('database').debug(`Creating default role "admin"...`)
                    })
                    new rolemodel({role_id: `${crypto.randomInt(1000, 99999999)}`, name: `default`, prefix: ``, created_by: `69`, permissions: []}).save(function (err, doc) {
                        if (err) return rej(err)
                        sendLog('database').debug(`Creating default role "default"...`)
                    })
                    sendLog("Database").info(`Populated default database entries successfully.`)
                }
            }).catch(err => {
                return rej(err)
            })
        })
    },

    // ===================== ACCOUNT =====================

    createAccount(accountId = 0, username = '', email = '', password = '', loginMethod = 1, emailVerified = false, sessionToken = "", authorizedDevices = []) {
        return new Promise(async (res, rej) => {
            await new accmodel({
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
                session_token: sessionToken,
                authorized_devices: authorizedDevices,
                realname: {name: null, identity: null},
            }).save().then(doc => {
                res(doc._id)
                sendLog('Database').info(`User ${username} (${accountId}) registered/created successfully.`)
            }).catch(err => {
                rej(err)
            })
        })
    },

    getAccountByUsername(username = "") {
        return new Promise(async (res) => {
            let resp = await accmodel.findOne({username: `${username}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    getAccountById(accountId = "", loginMethod = 1) {
        return new Promise(async (res) => {
           let resp = await accmodel.findOne({account_id: `${accountId}`, login_method: loginMethod})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    getAccountByEmail(accountEmail = "") {
        return new Promise(async (res) => {
            let resp = await accmodel.findOne({email: `${accountEmail}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    getAccountByGrantTicket(grantTicket = "", loginMethod = 1) {
        return new Promise(async (res) => {
            let resp = await accmodel.findOne({grant_ticket: `${grantTicket}`, login_method: loginMethod})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    getAccountByDeviceId(deviceId = "", loginMethod = 0) {
        return new Promise(async (res) => {
            let resp = await accmodel.findOne({authorized_devices: `${deviceId}`, login_method: loginMethod})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountById(accountId = "", grantTicket = "", sessionToken = "") {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({account_id: `${accountId}`}, {session_token: `${sessionToken}`, grant_ticket: `${grantTicket}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountVerifiedByEmail(accountEmail = "", verifiedEmail = false) {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({email: `${accountEmail}`}, {email_verified: `${verifiedEmail}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountPasswordByEmail(accountEmail = "", newPassword = "") {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({email: `${accountEmail}`}, {password: newPassword})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountByUsername(accountUsername = "", grantTicket = "") {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({username: `${accountUsername}`}, {grant_ticket: `${grantTicket}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountByGrantTicket(grantTicket = "", emailVerified = false) {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({grant_ticket: `${grantTicket}`}, {email_verified: emailVerified})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountRealnameById(accountId = "", realName = {}) {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({account_id: `${accountId}`}, {realname: realName})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountGrantDevicesByGrantTicket(grantTicket = "", authorizedDevices = []) {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({grant_ticket: `${grantTicket}`}, {authorized_devices: authorizedDevices})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountGrantDevicesById(accountId = "", authorizedDevices = []) {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({account_id: `${accountId}`}, {authorized_devices: authorizedDevices})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountSessionTokenByGrantTicket(grantTicket = "", sessionToken = "") {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({grant_ticket: `${grantTicket}`}, {session_token: sessionToken})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateAccountPasswordRstCodeById(accountId, emailCode = "") {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({account_id: `${accountId}`}, {forget_ticket: emailCode})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
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
            }).save().then(doc => {
                sendLog('Database').info(`Role ${roleName} (${doc.role_id}) created successfully.`)
            }).catch(err => {
                rej(err)
            })
        })
    },

    getRoleByName(roleName = "") {
        return new Promise(async (res, rej) => {
           let resp = await rolemodel.findOne({name: `${roleName}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    getRoleById(roleId = "") {
        return new Promise(async (res, rej) => {
            let resp = await rolemodel.findOne({role_id: `${roleId}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    getRoleByCreator(creatorId = "") {
        return new Promise(async (res, rej) => {
            let resp = await rolemodel.findOne({created_by: `${creatorId}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
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
            }).save().then(doc => {
                res(doc._id)
                console.log(doc)
                //sendLog('Database').info(`User ${username} (${accountId}) registered/created successfully.`)
            }).catch(err => {
                rej(err)
            })
        })
    },

    getQRByDeviceId(deviceId, ticket) {
        return new Promise(async (res, rej) => {
            let resp = await qrloginmodel.findOne({deviceId: `${deviceId}`, ticket: ticket})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    updateQRByDeviceId(deviceId = "", ticket = "", state = "") {
        return new Promise(async (res, rej) => {
            let resp = await qrloginmodel.updateOne({deviceId: `${deviceId}`, ticket: ticket}, {state: state})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },
}
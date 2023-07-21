const mongoose = require('mongoose')
const crypto = require('crypto')
const {sendLog} = require("../utils/logUtils")
const models = require('../utils/models')
const {ActionType} = require("../utils/constants")

const accmodel = new mongoose.model('accountModel', models.accountSchema(), 'account')
const rolemodel = new mongoose.model('roleModel', models.roleSchema(), 'roles')
const qrloginmodel = new mongoose.model("qrLoginModel", models.qrLoginSchema(), "qrtickets")
const devicegrantmodel = new mongoose.model("deviceGrantModel", models.deviceGrantSchema(), "devicetickets")

module.exports = {
    /**
     * Initialize connection to MongoDB database.
     *
     * @param {string} url Database connection url.
     * @return {conn} MongoDB database connection.
     */
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

    /**
     * Populates database with default values.
     */
    populateDatabaseDefaults() {
        return new Promise(async (res, rej) => {
            rolemodel.countDocuments({name: 'admin'}).then(count => {
                if (count === 0) {
                    new rolemodel({role_id: `${crypto.randomInt(1000, 99999999)}`, name: `admin`, prefix: `&6[&cAdmin&6]&r `, created_by: `69`, permissions: [`*`]}).save().then(() => {
                        sendLog('database').debug(`Creating default role "admin"...`)
                    }).catch(err => {
                        rej(err);
                    })

                    new rolemodel({role_id: `${crypto.randomInt(1000, 99999999)}`, name: `default`, prefix: ``, created_by: `69`, permissions: []}).save().then(() => {
                        sendLog('database').debug(`Creating default role "default"...`)
                    }).catch(err => {
                        rej(err);
                    })
                    sendLog("Database").info(`Populated default database entries successfully.`)
                }
            }).catch(err => {
                return rej(err)
            })
        })
    },

    // ===================== ACCOUNT =====================

    /**
     * Create new SDK server account.
     *
     * @param {Number} accountId UID of the account.
     * @param {String} username Username of the account.
     * @param {String} email Email of the account.
     * @param {String} password Account password, will be stored encrypted.
     * @param {Number} loginMethod Method account uses to log in.
     * @param {Boolean} emailVerified Is account email verified (shows email verification grant if false).
     * @param {String} comboToken Combo token of the made account.
     * @param {Array} authorizedDevices List of deviceIds allowed to access this account.
     * @return {Promise} Creates new account.
     */
    createAccount(accountId = 0, username = '', email = '', password = '', loginMethod = 1, emailVerified = false, comboToken= "", authorizedDevices = []) {
        return new Promise(async (res, rej) => {
            await new accmodel({
                account_id: `${accountId}`,
                username: `${username}`,
                email: `${email}`,
                password: `${password}`,
                banned: false,
                login_method: loginMethod,
                email_verified: emailVerified,
                grant_ticket: "",
                forget_ticket: "",
                combo_token: comboToken,
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

    /**
     * Retrieve account by username.
     *
     * @param {String} username Username of the account.
     * @return {Promise} Account data.
     */
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

    /**
     * Retrieve account by UID.
     *
     * @param {String} accountId UID of the account.
     * @return {Promise} Account data.
     */
    getAccountById(accountId = "") {
        return new Promise(async (res) => {
           let resp = await accmodel.findOne({account_id: `${accountId}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    /**
     * Retrieve account by Email address.
     *
     * @param {String} accountEmail Email address of the account.
     * @return {Promise} Account data.
     */
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

    /**
     * Retrieve account by UID.
     *
     * @param {String} deviceId DeviceId that you want to check for.
     * @param {Number} loginMethod Filter accounts that are using specified login method.
     * @return {Promise} Account data.
     */
    getAccountByDeviceId(deviceId = "", loginMethod = 0) {
        return new Promise(async (res) => {
            let resp = await accmodel.findOne({authorized_devices: { $elemMatch: {$eq: `${deviceId}`} }, login_method: loginMethod})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    /**
     * Update account by UID.
     *
     * @param {String} accountId UID of the account.
     * @param {String} comboToken Set account session token.
     * @return {Promise} Account data.
     */
    updateAccountById(accountId = "", comboToken = "") {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({account_id: `${accountId}`}, {combo_token: `${comboToken}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    /**
     * Update account email verification by Email address.
     *
     * @param {String} accountEmail Email address of the account.
     * @param {Boolean} verifiedEmail Is account email verified.
     * @return {Promise} Account data.
     */
    updateAccountEmailVerifyByEmail(accountEmail = "", verifiedEmail = false) {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({email: `${accountEmail}`}, {email_verified: `${verifiedEmail}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    /**
     * Update account password by Email address.
     *
     * @param {String} accountEmail Email address of the account.
     * @param {String} newPassword New account password, should be passed encrypted.
     * @return {Promise} Account data.
     */
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

    /**
     * Update account real name data by UID.
     *
     * @param {String} accountId UID of the account.
     * @param {Object} realName New real name data object.
     * @return {Promise} Account data.
     */
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

    /**
     * Update account authorized devices by UID.
     *
     * @param {String} accountId UID of the account.
     * @param {Array} authorizedDevices New list of authorized deviceIds.
     * @return {Promise} Account data.
     */
    updateAccountDevicesById(accountId = "", authorizedDevices = []) {
        return new Promise(async (res) => {
            let resp = await accmodel.updateOne({account_id: `${accountId}`}, {authorized_devices: authorizedDevices})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    /**
     * Update account forget ticket by UID.
     *
     * @param {String} accountId UID of the account.
     * @param {String} emailCode New forget ticket for this account.
     * @return {Promise} Account data.
     */
    updateAccountForgetTicketById(accountId, emailCode = "") {
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

    /**
     * Create new role.
     *
     * @param {String} roleName Name of the role.
     * @param {String} rolePrefix Prefix of the role.
     * @param {String} roleCreatorId UID of who made this role.
     * @param {Array} rolePermissions Permission node list the role should have.
     * @return {Promise} Creates new role.
     */
    /*createRole(roleName = "", rolePrefix = "", roleCreatorId = "69", rolePermissions = []) {
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
    },*/

    /**
     * Retrieve role by name.
     *
     * @param {String} roleName Name of the role.
     * @return {Promise} Role data.
     */
    /*getRoleByName(roleName = "") {
        return new Promise(async (res, rej) => {
           let resp = await rolemodel.findOne({name: `${roleName}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },*/

    /**
     * Retrieve role by ID.
     *
     * @param {String} roleId ID of the role.
     * @return {Promise} Role data.
     */
    /*getRoleById(roleId = "") {
        return new Promise(async (res) => {
            let resp = await rolemodel.findOne({role_id: `${roleId}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },*/

    /**
     * Retrieve role by its Creator.
     *
     * @param {String} creatorId UID of the role creator.
     * @return {Promise} Role data.
     */
    /*getRoleByCreator(creatorId = "") {
        return new Promise(async (res, rej) => {
            let resp = await rolemodel.findOne({created_by: `${creatorId}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },*/

    // ===================== QRCODE LOGIN =====================

    /**
     * Create new QRCode entry.
     *
     * @param {String} ticket QRCode ticket.
     * @param {String} state State of this QRCode.
     * @param {String} deviceId DeviceId who initialized this QRCode entry.
     * @param {String} expires When will this QRCode entry expire.
     * @return {Promise} Creates QRCode login entry.
     */
    createQR(ticket = "", state = ActionType.qrode.INIT, deviceId = "", expires = "") {
        return new Promise(async (res, rej) => {
            new qrloginmodel({
                ticket: ticket,
                state: state,
                deviceId: deviceId,
                expires: expires
            }).save().then(doc => {
                res(doc._id)
                //sendLog('Database').info(`User ${username} (${accountId}) registered/created successfully.`)
            }).catch(err => {
                rej(err)
            })
        })
    },

    /**
     * Retrieve QRCode entry by deviceId.
     *
     * @param {String} deviceId DeviceId for this entry.
     * @param {String} ticket QRCode ticket.
     * @return {Promise} QRCode data.
     */
    getQRByDeviceId(deviceId, ticket) {
        return new Promise(async (res) => {
            let resp = await qrloginmodel.findOne({deviceId: `${deviceId}`, ticket: `${ticket}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    /**
     * Update QRCode entry by deviceId.
     *
     * @param {String} deviceId DeviceId for this entry.
     * @param {String} ticket QRCode ticket.
     * @param {String} state State of this QRCode.
     * @return {Promise} QRCode data.
     */
    updateQRByDeviceId(deviceId = "", ticket = "", state = "") {
        return new Promise(async (res) => {
            let resp = await qrloginmodel.updateOne({deviceId: `${deviceId}`, ticket: ticket}, {state: state})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    /**
     * Delete QRCode entry by deviceId.
     *
     * @param {String} deviceId DeviceId for this entry.
     * @param {String} ticket = Ticket for this entry.
     * @return {Promise} Deletes QRCode data.
     */
    /*deleteQRByDeviceId(deviceId = "", ticket = "") {
        return new Promise(async (res) => {
            let resp = await qrloginmodel.deleteOne({deviceId: `${deviceId}`, ticket: ticket})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },*/

    // ===================== DEVICE GRANT =====================

    /**
     * Create new deviceGrant entry.
     *
     * @param {String} ticket deviceGrant ticket.
     * @param {Number} state State of this deviceGrant.
     * @param {String} deviceId DeviceId who initialized this deviceGrant entry.
     * @param {String} email Email of the account who made this grant.
     * @return {Promise} Creates deviceGrant entry.
     */
    createDeviceGrant(ticket = "", state = 0, deviceId = "", email = "") {
        return new Promise(async (res, rej) => {
            new devicegrantmodel({
                ticket: ticket,
                state: state,
                code: "",
                deviceId: deviceId,
                email: email
            }).save().then(doc => {
                res(doc._id)
            }).catch(err => {
                rej(err)
            })
        })
    },

    /**
     * Retrieve deviceGrant data by ticket.
     *
     * @param {String} grantTicket Grant ticket issued for this device grant.
     * @return {Promise} deviceGrant data.
     */
    getDeviceGrantByTicket(grantTicket = "") {
        return new Promise(async (res) => {
            let resp = await devicegrantmodel.findOne({ticket: `${grantTicket}`})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    /**
     * Update deviceGrant entry by ticket.
     *
     * @param {String} ticket deviceGrant ticket.
     * @param {Number} state State of this deviceGrant.
     * @param {String} code Code of this deviceGrant.
     * @return {Promise} deviceGrant data.
     */
    updateDeviceGrantByTicket(ticket = "", state = 1, code = "") {
        return new Promise(async (res) => {
            let resp = await devicegrantmodel.updateOne({ticket: ticket}, {state: state, code: code})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },

    /**
     * Delete deviceGrant entry by deviceId.
     *
     * @param {String} deviceId DeviceId for this entry.
     * @param {String} ticket = Ticket for this entry.
     * @return {Promise} Deletes deviceGrant data.
     */
    /*deleteDeviceGrantByDeviceId(deviceId = "", ticket = "") {
        return new Promise(async (res) => {
            let resp = await devicegrantmodel.deleteOne({deviceId: `${deviceId}`, ticket: ticket})
            if (resp) {
                res(resp)
            } else {
                res(resp)
            }
        })
    },*/
}
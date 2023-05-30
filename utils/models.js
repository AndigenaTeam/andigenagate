const mongoose = require('mongoose')
const constants = require("./constants");

module.exports = {
    /**
     * Construct the roles collection schema.
     */
    roleSchema() {
        return new mongoose.Schema({
            role_id: { type: String, index: true, unique: true },
            name: { type: String, min: 5, max: 30, index: true, unique: true },
            prefix: { type: String },
            created_by: { type: String },
            permissions: {type: Array, default: []}
        });
    },

    /**
     * Construct the QRLogin collection schema.
     */
    qrLoginSchema() {
        return new mongoose.Schema({
            ticket: { type: String, index: true, unique: true },
            state: {type: String, default: ''},
            deviceId: {type: String, default: ''},
            expires: {type: String, default: ''}
        });
    },

    /**
     * Construct the deviceGrant collection schema.
     */
    deviceGrantSchema() {
        return new mongoose.Schema({
            ticket: { type: String, index: true, unique: true },
            state: {type: Number, default: 0},
            code: {type: String, default: ''},
            email: {type: String, default: ''},
            deviceId: {type: String, default: ''}
        });
    },

    /**
     * Construct the accounts collection schema.
     */
    accountSchema() {
        return new mongoose.Schema({
            account_id: { type: String, index: true, unique: true },
            username: { type: String, min: 5, max: 10, index: true, unique: true },
            email: { type: String, match: constants.EMAIL_REGEX, index: true, unique: true },
            password: { type: String, min: 8 },
            banned: {type: Boolean},
            login_method: {type: Number, min: 0, max: 3 },
            email_verified: {type: Boolean, default: false},
            forget_ticket: {Type: String},
            session_token: {type: String},
            authorized_devices: {type: Array, default: []},
            realname: {name: {Type: String}, identity: {Type: String}}
            //game_accounts: {type: Object, default: {}}
        });
    }
}
const mongoose = require('mongoose')
const constants = require("./constants");

module.exports = {
    roleSchema() {
        return new mongoose.Schema({
            role_id: { type: String, index: true, unique: true },
            name: { type: String, min: 5, max: 30, index: true, unique: true },
            prefix: { type: String },
            created_by: { type: String },
            permissions: {type: Array, default: []}
        });
    },

    qrLoginSchema() {
        return new mongoose.Schema({
            ticket: { type: String, index: true, unique: true },
            state: {type: String, default: ''},
            deviceId: {type: String, default: ''},
            expires: {type: String, default: ''}
        });
    },

    accountSchema() {
        return new mongoose.Schema({
            account_id: { type: String, index: true, unique: true },
            username: { type: String, min: 5, max: 10, index: true, unique: true },
            email: { type: String, match: constants.EMAIL_REGEX, index: true, unique: true },
            password: { type: String, min: 8 },
            banned: {type: Boolean},
            operator: {type: Boolean},
            login_method: {type: Number, min: 0, max: 3 },
            last_version: {type: String, default: null },
            role: {type: String},
            email_verified: {type: Boolean, default: false},
            grant_ticket: {type: String},
            forget_ticket: {Type: String},
            session_token: {type: String},
            authorized_devices: {type: Array, default: []},
            qrdata: {ticket: {Type: String}, state: {Type: String}},
            realname: {name: {Type: String}, identity: {Type: String}}
            //game_accounts: {type: Object, default: {}}
        });
    }
}
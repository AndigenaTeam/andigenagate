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

    accountSchema() {
        return new mongoose.Schema({
            account_id: { type: String, index: true, unique: true },
            username: { type: String, min: 5, max: 10, index: true, unique: true },
            email: { type: String, match: constants.EMAIL_REGEX, index: true, unique: true },
            password: { type: String, min: 8 },
            last_region: {type: String},
            banned: {type: Boolean},
            operator: {type: Boolean},
            login_method: {type: Number, min: 0, max: 3},
            last_version: {type: String, default: '' },
            role: {type: String},
            email_verified: {type: Boolean, default: false},
            grant_ticket: {type: String, default: ""},
            session_token: {type: String, default: ""},
            authorized_devices: {type: Array, default: []}
            //game_accounts: {type: Object, default: {}}
        });
    }
}
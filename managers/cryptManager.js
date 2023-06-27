const crypto = require('crypto')
const bcrypt = require('bcrypt')
const cfg = require('../config.json')
const {readFileSync} = require('fs')
const keys = require("../data/configs/keys.json");

module.exports = {

    /**
     * Decrypt account password sent from the client.
     *
     * @param {String} key Key used to decrypt.
     * @param {Buffer} accountPassword Encrypted account password.
     * @return {Buffer} Decrypted password as buffer.
     */
    decryptPassword(key, accountPassword) {
        let decryptkeypub = crypto.createPrivateKey({key: readFileSync(key), format: 'pem'}).export({format: 'pem', type: 'pkcs1'})

        let chunkSize = 2048 / 8
        const chunkCount = Math.ceil(accountPassword.length / chunkSize)
        let chunks = []

        for (let i = 0; i < chunkCount; i++) {
            const chunk = accountPassword.subarray(i * chunkSize, (i + 1) * chunkSize)
            chunks.push(crypto.privateDecrypt({ key: decryptkeypub, padding: crypto.constants.RSA_PKCS1_PADDING }, chunk))
        }

        return Buffer.concat(chunks)
    },

    /**
     * Encrypt various things using bcrypt.
     *
     * @param {String} accountPassword String to encrypt, can be anything not only account password.
     * @return {Promise} QRCode data.
     */
    encryptPassword(accountPassword) {
        return new Promise((res) => {
            bcrypt.hash(accountPassword, cfg.advanced.cryptography.accountPasswordHashRounds).then(function(hash) {
                res(hash)
            })
        })
    },

    /**
     * Validates if two strings match.
     *
     * @param {String} accountPassword Encrypted string to verify against.
     * @param {String} clientPassword String provided to match with.
     * @param {Boolean} decrypt Perform account password client decryption if set to true.
     * @return {Promise} If provided string/password is valid.
     */
    validatePassword(accountPassword, clientPassword, decrypt = true) {
        return new Promise((res) => {
            let decrypted = (decrypt) ? module.exports.decryptPassword(`${keys.signingKey}`, Buffer.from(clientPassword, 'base64')).toString("utf-8") : clientPassword
            bcrypt.compare(decrypted, accountPassword).then(function(result) {
                res(result)
            });
        })
    },

    /**
     * Censor provided text.
     *
     * @param {Type: String | StringConstructor} text Text to censor.
     */
    censorString(text = "") {
        if (text.length < 4) {
            return `${'*' * text.length}`
        } else {
            let start = (text.length >= 10) ? 2 : 1
            let end = (text.length) > 5 ? 2 : 1
            return `${text[(start > 1) ? start : 0]}****${text[text.length - end+1]}`
        }
    },

    /**
     * Censor provided email address.
     *
     * @param {String} text Text to censor.
     */
    censorEmail(text = "") {
        let splitted = text.split('@')
        let split2 = splitted[1].split('.')
        return `${module.exports.censorString(splitted[0])}@${split2[0]}.${split2[1]}`
    },

    /**
     * Generate an UID.
     *
     * @return {String} Generated UID prefixed by configured prefix.
     */
    generateUid() {
        return cfg.advanced.uidPrefix + Math.floor(1000 + Math.random() * 9000).toString();
    },

    /**
     * Generate a generic token used at various places.
     *
     * @return {String} Generated token.
     */
    generateToken() {
        return Buffer.from(crypto.randomUUID().replaceAll('-', '')).toString("hex");
    },

    /**
     * Generate a 6-digit code used for various verifications.
     *
     * @return {String} Generated code.
     */
    generateVerifyCode() {
        return parseInt(Buffer.from(crypto.randomBytes(3)).toString("hex"), 16).toString().substring(0, 6);
    }
}
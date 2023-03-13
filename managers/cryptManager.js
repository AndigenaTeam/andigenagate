const crypto = require('crypto')
const bcrypt = require('bcrypt')
const cfg = require('../config.json')
const {readFileSync} = require('fs')
const keys = require("../data/configs/keys.json");

module.exports = {

    /*xorData(data, key) {
        for (let i = 0; i < data.length; i++) {
            data[i] ^= key[i % key.length];
        }
    },

    cloneBuffer(buffer) {
        const other = Buffer.allocUnsafe(buffer.length);
        buffer.copy(other);
        return other;
    },

    ec2b(buffer, key) {
        buffer = this.cloneBuffer(buffer);
        this.xorData(buffer, key);
        return buffer;
    },*/

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

        /*let pubkey = readFileSync(key)
        const chunkSize = (2048 / 8) - 11
        const chunkCount = Math.ceil(accountPassword.length / chunkSize)
        const chunks = []

        for (let i = 0; i < chunkCount; i++) {
            const chunk = accountPassword.subarray(i * chunkSize, (i + 1) * chunkSize)
            chunks.push(crypto.publicEncrypt({ key: pubkey, padding: crypto.constants.RSA_PKCS1_PADDING }, chunk))
        }

        return Buffer.concat(chunks)*/
    },

    /**
     * Validates if two strings match.
     *
     * @param {String} accountPassword Encrypted string to verify against.
     * @param {String} clientPassword String provided to match with.
     * @param {Boolean} decrypt Perform account password client decryption if set to true.
     * @return {Promise} QRCode data.
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
     * @param {String} text Text to censor.
     */
    censorString(text = "") {
        if (text.length < 4) {
            return `${'*' * text.length}`
        } else {
            let start = (text.length >= 10) ? 2 : 1
            let end = (text.length) > 5 ? 2 : 1
            return `${text[(start > 1) ? start : 0]}****${text[(end > 1) ? text.length - end : 0]}`
        }
    },

    /**
     * Censor provided email address.
     *
     * @param {String} text Text to censor.
     */
    censorEmail(text = "") {
        let splitted = text.split('@')
        return `${module.exports.censorString(splitted[0])}@${module.exports.censorString(splitted[1])}`
    }
}
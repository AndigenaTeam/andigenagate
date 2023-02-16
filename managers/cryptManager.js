const crypto = require('crypto')
const {readFileSync} = require('fs')

module.exports = {

    xorData(data, key) {
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
    },

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

    encryptPassword(key, accountPassword) {
        let pubkey = readFileSync(key)
        const chunkSize = (2048 / 8) - 11
        const chunkCount = Math.ceil(accountPassword.length / chunkSize)
        const chunks = []

        for (let i = 0; i < chunkCount; i++) {
            const chunk = accountPassword.subarray(i * chunkSize, (i + 1) * chunkSize)
            chunks.push(crypto.publicEncrypt({ key: pubkey, padding: crypto.constants.RSA_PKCS1_PADDING }, chunk))
        }

        return Buffer.concat(chunks)
    }
}
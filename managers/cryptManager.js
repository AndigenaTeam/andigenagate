
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
    }
}
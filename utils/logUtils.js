const Logger = require('colorful-log')
const {readdir, readFileSync, unlink} = require("fs");
const compressing = require('compressing')

module.exports = {
    /**
     * Writes pretty sexy console message and logs to file.
     *
     * @param {string} system What part of the service is sending the log.
     * @return {Logger} Constructed logger ready to provide functions to actually send a message.
     */
    sendLog(system) {
        return new Logger.default({
            debug: (process.env.ENV === "dev"),
            path: './logs/',
            system: {
                name: `${system}`,
                maxLength: system.length
            },
            saveInterval: 60000 // 60 secs
        })
    },

    /**
     * Archives all old logs that are not made on current date.
     */
    archiveOldLogs() {
        return new Promise((res, rej) => {
            readdir('./logs', async function (err, list) {
                if (err) return rej(err)

                let day = (new Date().getDate() < 10) ? `0${new Date().getDate()}` : new Date().getDate()
                let month = (new Date().getMonth() < 10) ? `0${new Date().getMonth()+1}` : new Date().getMonth()+1
                let curd = `${new Date().getFullYear()}-${month}-${day}`

                list.forEach(i => {
                    if (i.split('.')[1] !== 'tgz' && i.split('.')[0] !== curd) {
                        compressing.tgz.compressFile(readFileSync(`./logs/${i}`), `./logs/${i.split('.')[0]}.tgz`, {relativePath: `./logs/${i}`})
                            .then(() => {
                                unlink(`./logs/${i}`, async function (err1) {
                                    if (err1) return rej(err1)
                                })
                            }).catch(err2 => rej(err2));
                    }
                })
            })
        })
    }
}
const Logger = require('colorful-log')

module.exports = {
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
    }
}
require('dotenv').config()
const express = require('express')
const bodyParser = require("body-parser");
const http = express()

const {sendLog, archiveOldLogs} = require('./utils/logUtils')
const {createFoldersAndConfigs} = require('./utils/configUtils')
const db = require('./managers/databaseManager')

archiveOldLogs().then(() => {})
createFoldersAndConfigs()
const cfg = require('./config.json')

http.use(bodyParser.urlencoded({extended: true}))
http.use(bodyParser.json())

http.use(express.static('./public'))
http.use('/', require('./routes/registerRoutes'))
http.use('/', require('./routes/twofactorRoutes'))
http.use('/', require('./routes/loginRoutes'))
http.use('/', require('./routes/miscRoutes'))

http.get('/', async function(req, res) {
    res.render('index.html')
})

http.get('/mihoyo/common/accountSystemSandboxFE/index.html', async function(req, res) {
    res.send('index.html')
})

const server = http.listen(cfg.serverPort, `${cfg.serverAddress}`, async () => {
    db.connect(process.env.DB_URL)
    sendLog("gate").info(`AndigenaGate listening on ${server.address().address}:${server.address().port}`)
})
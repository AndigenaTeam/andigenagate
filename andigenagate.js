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
const {join} = require("path");

http.use(bodyParser.urlencoded({extended: true}))
http.use(bodyParser.json())

http.use(express.static('./public'))

http.use('/', require('./routes/sdk/register'))
http.use('/', require('./routes/sdk/devicegrant'))
http.use('/', require('./routes/sdk/login'))
http.use('/', require('./routes/sdk/sdkhtml'))
http.use('/', require('./routes/sdk/qrpanda'))
http.use('/', require('./routes/sdk/captcha'))
http.use('/', require('./routes/sdk/compatibility'))

http.use('/', require('./routes/sdk/announcement'))
http.use('/', require('./routes/webstatic/webstatic'))

http.use('/', require('./routes/misc'))

http.get('/', async function(req, res) {
    res.render('index.html')
})

http.get('/mihoyo/common/accountSystemSandboxFE/index.html', async function(req, res) {
    es.sendFile(join(__dirname+'/public/index.html'));
})

// ==============================================================================
//                                 NOTICES
//                               html renderer
// ==============================================================================

http.get(`/hk4e/announcement/index.html`, async function (req, res) {
    res.sendFile(join(__dirname+'/public/index.html'));
})

const server = http.listen(cfg.serverPort, `${cfg.serverAddress}`, async () => {
    db.connect(process.env.DB_URL)
    sendLog("gate").info(`AndigenaGate listening on ${server.address().address}:${server.address().port}`)
})
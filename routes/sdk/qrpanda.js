const express = require('express')
const {statusCodes, ActionType} = require('../../utils/constants');
const dbm = require("../../managers/databaseManager");
const cfg = require("../../config.json");
const {sendLog} = require("../../utils/logUtils");
const superagent = require("superagent");
const {generateToken, censorString, censorEmail} = require("../../managers/cryptManager");

module.exports = (function() {
    let qr = express.Router();

// ==============================================================================
//                                 QR CODE
//                                fetch code
// ==============================================================================

    qr.post(`/:platform/combo/panda/qrcode/fetch`, async function(req, res) {
        try {
            sendLog('/panda/qrcode/fetch').debug(JSON.stringify(req.body));

            if (!cfg.allowQRCodeLogin) return res.json({retcode: statusCodes.error.FAIL, message: "QRCode login is disabled!"})

            let url;
            let expires = new Date().setHours(1, 0, 0).toString();
            let ticket = generateToken();

            if (cfg.socialLogin.discordQR.enabled) {
                url = cfg.socialLogin.discordQR.url;
            } else {
                url = (cfg.serverDomain !== "") ? `${cfg.serverDomain}/Api/login_by_qr` : `${cfg.serverAddress}:${cfg.serverPort}/Api/login_by_qr`;
            }

            await dbm.createQR(`${ticket}`, `${ActionType.qrcode.INIT}`, `${req.body.device}`, `${expires}`)

            //console.log(`${url}?expire=${expires}\u0026ticket=${ticket}\u0026device=${req.body.device}`)
            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {url: `${url}?expire=${expires}\u0026ticket=${ticket}\u0026device=${req.body.device}`}})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 QR CODE
//                              query progress
// ==============================================================================

    qr.post(`/:platform/combo/panda/qrcode/query`, async function(req, res) {
        try {
            sendLog('/panda/qrcode/query').debug(JSON.stringify(req.body));
            let payload = {};

            if (!cfg.allowQRCodeLogin) return res.json({retcode: statusCodes.error.FAIL, message: "QRCode login is disabled!"});

            let qrd = await dbm.getQRByDeviceId(req.body.device, req.body.ticket);

            if (!qrd) return res.json({retcode: statusCodes.error.FAIL, message: "Ticket cache information error."});
            if (new Date(qrd.expires) < Date.now()) return res.json({retcode: statusCodes.error.LOGOUT_ERROR, message: `QRCode expired, generate a new one.`});

            if (qrd.state === ActionType.qrcode.CONFIRMED) {
                let account = await dbm.getAccountByDeviceId(req.body.device, 2);
                if (account === null) return res.json({retcode: statusCodes.error.FAIL, message: "Account does not exist!"});
                let rnd = JSON.parse(JSON.stringify(account.realname));

                if (!account.authorized_devices.includes(req.body.device)) {
                    account.authorized_devices.push(req.body.device);
                    await dbm.updateAccountDevicesById(account.account_id, account.authorized_devices);
                }

                let token = generateToken();

                await dbm.updateAccountById(account.account_id, token);

                payload = {"proto": "Account",
                    "raw": JSON.stringify({"uid": `${account.account_id}`, "name": `${censorString(account.username)}`, "email": `${censorEmail(account.email)}`,
                        "is_email_verify": false, "realname": `${rnd.name}`, "identity_card": `${rnd.identity}`, "token": token, "country": "ZZ"}) }

            } else {
                payload = {}
            }

            res.json({retcode: statusCodes.success.RETCODE, message: "OK", data: {stat: qrd.state, payload: payload }})
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 QR CODE
//                                redirecter
// ==============================================================================

    qr.get(`/Api/login_by_qr`, async function (req, res) {
        try {
            let qrd = await dbm.getQRByDeviceId(req.query.device, req.query.ticket);

            if (!qrd || new Date(qrd.expires) < Date.now() || qrd.state !== ActionType.qrcode.INIT) return res.send(`<h3>Invalid request or QR code has expired. Please scan code displayed by game window again.</h3>`);

            await dbm.updateQRByDeviceId(req.query.device, req.query.ticket, ActionType.qrcode.SCANNED);

            let params = Buffer.from(`${JSON.stringify({expire: qrd.expires, device: req.query.device, ticket: req.query.ticket})}`).toString("base64");

            res.redirect(`${process.env.DISCORD_OAUTH_BASE}?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${cfg.socialLogin.discordQR.callbackUrl}&response_type=code&scope=${process.env.DISCORD_OAUTH_SCOPES}&state=${params}`)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 QR CODE
//                           redirecter callback
// ==============================================================================

    qr.get(`/Api/login_by_qr/callback`, async function (req, resp) {
        try {
            const {code} = req.query;
            if (!req.query.code) {
                return resp.send('No access code specified');
            }

            let paramsd = Buffer.from(`${req.query.state}`, 'base64').toString("utf-8");
            let params = JSON.parse(paramsd)

            let qrd = await dbm.getQRByDeviceId(params.device, params.ticket);

            if (!qrd || new Date(qrd.expires) < Date.now() || qrd.state !== ActionType.qrcode.SCANNED) return resp.send(`<h3>Invalid request or QR code has expired. Please scan code displayed by game window again.</h3>`);

            await superagent.post(`https://discord.com/api/oauth2/token`)
                .send({client_id: process.env.DISCORD_CLIENT_ID, client_secret: process.env.DISCORD_CLIENT_SECRET, code,
                    grant_type: 'authorization_code', redirect_uri: `${cfg.socialLogin.discordQR.callbackUrl}`, scope: `${process.env.DISCORD_OAUTH_SCOPES}`
                }).set('Content-Type', 'application/x-www-form-urlencoded')
                .end(async (err, res) => {
                    let url = (cfg.serverDomain !== "") ? cfg.serverDomain : `${cfg.serverAddress}:${cfg.serverPort}/`;
                    if (err) res.redirect(url);

                    await dbm.updateQRByDeviceId(params.device, params.ticket, ActionType.qrcode.CONFIRMED);

                    req.session.token = res.body.access_token;
                    resp.redirect(`/sdkDiscordLogin.html?data=${req.query.state}`);
                })
        } catch (e) {
            sendLog('Gate').error(e)
            resp.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 QR CODE
//                           redirecter post???
// ==============================================================================

    qr.post(`/Api/login_by_qr`, async function (req, res) {
        try {
            console.log(req.body)
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    return qr;
})()
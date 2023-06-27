const express = require('express')
const {statusCodes} = require('../../utils/constants');
const cfg = require("../../config.json");
const superagent = require("superagent");
const dbm = require("../../managers/databaseManager");
const {sendLog} = require("../../utils/logUtils");
const {generateUid} = require("../../managers/cryptManager");

module.exports = (function() {
    let sdkhtml = express.Router();

// ==============================================================================
//                                 SDK HTML
//                                 discord
// ==============================================================================

    sdkhtml.get(`/sdkDiscordLogin.html`, async function (req, resp) {
        try {
            let url = (cfg.serverDomain !== "") ? `${cfg.serverDomain}` : `${cfg.serverAddress}:${cfg.serverPort}`;
            if(!req.session.token) {
                return resp.redirect(url);
            }

            await superagent.get(`https://discord.com/api/users/@me`)
                .set('authorization', `Bearer ${req.session.token}`)
                .end(async (err, res1) => {
                    if (err) return resp.redirect(url);

                    req.session.userid = res1.body.id
                    req.session.avatar = res1.body.avatar

                    let uid = generateUid();
                    let paramsd = Buffer.from(`${req.query.data}`, 'base64').toString("utf-8")
                    let params = JSON.parse(paramsd)

                    if (req.session.userid) {
                        let account = await dbm.getAccountByEmail(res1.body.email);
                        if (account === null) {
                            await dbm.createAccount(parseInt(uid), `${res1.body.username}`, `${res1.body.email}`, "", 2, true, "", [params.device])
                        }

                        resp.send(`<h2>You have successfully completed the login process, you can close this window and continue ingame.</h2>`)
                    } else {
                        resp.redirect(url)
                    }
                })
        } catch (e) {
            sendLog('Gate').error(e)
            resp.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 SDK HTML
//                                 twitter
// ==============================================================================

    sdkhtml.get(`/sdkTwitterLogin.html`, async function (req, res) {
        try {
            if (cfg.socialLogin.twitter.enabled) {
                res.redirect(cfg.socialLogin.twitter.url)
            } else {
                res.send("not yet implemented")
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    sdkhtml.all(`/twitterLoginCallback`, async function (req, res) {
        try {
            res.send("not yet implemented")
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

// ==============================================================================
//                                 SDK HTML
//                                 facebook
// ==============================================================================

    sdkhtml.get(`/sdkFacebookLogin.html`, async function (req, res) {
        try {
            if (cfg.socialLogin.facebook.enabled) {
                res.redirect(cfg.socialLogin.facebook.url)
            } else {
                res.send("not yet implemented")
            }
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    return sdkhtml;
})()
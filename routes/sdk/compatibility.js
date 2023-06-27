const express = require('express')
const {statusCodes} = require('../../utils/constants');
const {sendLog} = require("../../utils/logUtils");
const cfg = require("../../config.json");
const {getAccountById} = require("../../managers/databaseManager");

module.exports = (function() {
    let comp = express.Router();

// ==============================================================================
//                             COMPATIBILITY
//                              weed wacker
// ==============================================================================

    comp.get(`/extensions/combo/verify`, async function (req, res) {
        try {
            sendLog('/extensions/combo/verify').debug(JSON.stringify({uid: req.query.uid, combo_token: req.query.combo_token}));

            if (!cfg.advanced.weedWackerCompatibility) return res.json({retcode: statusCodes.error.FAIL, message: "WeedWacker login support is not enabled!"})
            if (!req.query.uid || !req.query.combo_token) return res.sendStatus(401);

            let account = await getAccountById(`${req.query.uid}`);
            if (account === null || account.combo_token !== req.query.combo_token) return res.sendStatus(401)

            sendLog(`Gate WeedWacker Compatibility`).info(`Account with uid ${req.query.uid} attempted weedwacker login.`);
            res.sendStatus(200);
        } catch (e) {
            sendLog('Gate').error(e)
            res.json({retcode: statusCodes.error.FAIL, message: "An error occurred, try again later! If this error persist contact the server administrator."})
        }
    })

    return comp;
})()
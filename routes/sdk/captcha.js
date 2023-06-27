const express = require('express')
const {statusCodes} = require('../../utils/constants');

module.exports = (function() {
    let captcha = express.Router();

// ==============================================================================
//                                 CAPTCHA
//                            create a captcha
// ==============================================================================

    captcha.get('/Api/create_mmt', async function(req, res) {
        res.json({code: statusCodes.error.FAIL})
    })

    return captcha;
})()
const express = require('express')
const {statusCodes} = require('../../utils/constants');
const {existsSync, readFileSync} = require("fs");

module.exports = (function() {
    let webs = express.Router();

// ==============================================================================
//                                 WEBSTATIC
//                               language files
// ==============================================================================

    webs.get(`/admin/mi18n/:platform/:path/:langfile.json`, function (req, res) {
        if (!existsSync(`./data/languages/${req.params.path}`)) return res.json({retcode: statusCodes.error.FAIL, message: "An error occurred looking for path you specified!"});

        return res.send(readFileSync(`./data/languages/${req.params.path}/${process.env.ENV === "dev" ? "en" : req.params.langfile}.json`, {encoding: "utf-8"}))
    })

// ==============================================================================
//                                 WEBSTATIC
//                              static resources
// ==============================================================================

    webs.get(`/upload/static-resource/2022/01/11/:file`, function (req, res) {
        if (!existsSync(`./data/images/${req.params.file}`)) return res.json({retcode: statusCodes.error.FAIL, message: "An error occurred looking for path you specified!"});

        res.sendFile(`./data/images/${req.params.file}`)
    })

    return webs;
})()
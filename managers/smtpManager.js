const nodemailer = require("nodemailer")
const {sendLog} = require("../utils/logUtils")

module.exports = {
    /**
     * Sends verification email to the account's email address.
     *
     * @param {String} email Account email.
     * @param {String} subject Email subject.
     * @param {String} text Email content in text format.
     * @param {String} html Email content in html format.
     * @return {Promise} Sends email.
     */
    sendEmail(email, subject, text, html) {
        return new Promise((res, rej) => {
            let transporter = nodemailer.createTransport({
                name: `${process.env.SMTP_NAME}`, host: `${process.env.SMTP_HOST}`, port: parseInt(process.env.SMTP_PORT), secureConnection: process.env.SMTP_SECURE,
                auth: {user: `${process.env.SMTP_USER}`, pass: `${process.env.SMTP_PASS}`},
                logger: false, transactionLog: false,
                tls: {rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED, ciphers: 'SSLv3'}
            })

            transporter.verify(function (error) {
                if (error) return sendLog('Email Utilty').error(error)
            });

            transporter.sendMail({
                from: `${process.env.SMTP_USER}`,
                to: `${email}`,
                subject: `${subject}`,
                text: `${text}`,
                html: `${html}`,
            }, function(error, info) {
                if (error) return rej(error)
                res(info)
            });


        })
    }
}
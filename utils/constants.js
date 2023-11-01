
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

const ActionType = {
    qrcode: {
        INIT: "Init",
        SCANNED: "Scanned",
        CONFIRMED: "Confirmed"
    },
    realname: {
        NONE: 0,
        BIND_NAME: 1,
        MODIFY_NAME: 2,
        BIND_PERSON: 3,
        VERIFY_PERSON: 4
    },
    NONE: "ACTION_NONE",
    LOGIN: "login",
    REGIST: "regist",
    VERIFY_CODE_REQ: 'verifycodereq',
    VERIFY_CODE_RESP: 'verifycoderesp',
    RESET_PASSWORD: 'resetpassword',
    REBIND_MOBILE_END: "rebind_mobile_end",
    REBIND_SAFEMOBILE_END: "rebind_safemobile_end",
    CHANGE_PASSWORD: "change_password",
    BIND_MOBILE: "bind_mobile",
    UNBIND_MOBILE: "unbind_mobile",
    BIND_USERNAME: "bind_username",
    BIND_EMAIL: "bind_email",
    UNBIND_EMAIL: "unbind_email",
    BIND_REALNAME: "bind_realname",
    REBIND_MOBILE: "rebind_mobile",
    EXTINFO: "extinfo",
    BIND_SAFEMOBILE: "bind_safemobile",
    UNBIND_SAFEMOBILE: "unbind_safemobile",
    GROUP_BIND: "group_bind",
    VERIFY_EMAIL: "verify_email",
    REBIND_SAFEMOBILE: "rebind_safemobile",
    UNGROUP_BIND: "ungroup_bind",
    GROUP_ACCOUNT: "group_account",
    CANCEL_REBIND_MOBILE: "cancel_rebind_mobile",
    LOG_QUERY: "log_query",
    GAME_CTRL: "game_ctrl",
    BIND_FB: "bind_fb",
    UNBIND_FB: "unbind_fb",
    BIND_THIRD: "bind_third",
    UNBIND_THIRD: "unbind_third",
    BIND_GUARDIAN: "bind_guardian",
    DELETE_ACCOUNT: "delete_account",
    DEVICE_GRANT: "device_grant",
    REBIND_EMAIL: "rebind_email",
    REBIND_EMAIL_END: "rebind_email_end",
    CHECK_ACCOUNT_CAN_DELETE: "check_can_delete_account"
}

const ClientType = {
    Editor: 0,
    IOS: 1,
    Android: 2,
    PC: 3,
    PS4: 4,
    Server: 5,
    CloudAndroid: 6,
    CloudIOS: 7,
    PS5: 8,
    CloudWeb: 9,
    CloudTV: 10,
    CloudMAC: 11,
    CloudPC: 12,
    Cloud3rdPartyMobile: 13,
    Cloud3rdPartyPC: 14
}

const PlatformType = {
    CN: "hk4e_cn",
    OS: "hk4e_global"
}

const SceneType = {
    Normal: "S_NORMAL",
    Account: "S_ACCOUNT",
    User: "S_USER",
    Temple: "S_TEMPLE"
}

const loginStatusEnum = {
    NEW_DEVICE_VERIFY: -448,
    IS_DELETE_ACCOUNT: -447
}

const preGrantWay = {
    WAY_EMAIL: 'Way_Email',
    WAY_BINDMOBILE: 'Way_BindMobile'
}

const statusCodes = {
    error: {
        FAIL: -1,
        CANCEL: -2,
        NO_SUCH_METHOD: -10,
        LOGIN_BASE: -100,
        LOGIN_FAILED: -101,
        LOGIN_CANCEL: -102,
        LOGIN_ERROR: -103,
        LOGOUT_FAILED: -104,
        LOGOUT_CANCEL: -105,
        LOGOUT_ERROR: 106,
        PAY_FAILED: -107,
        PAY_CANCEL: -108,
        PAY_ERROR: -109,
        PAY_UNKNOWN: -116,
        EXIT_FAILED: -110,
        EXIT_NO_DIALOG: -111,
        EXIT_CANCEL: -112,
        EXIT_ERROR: -113,
        INIT_FAILED: -114,
        INIT_ERROR: -115,
        LOGIN_FORBIDDED: -117,
        NEED_REALNAME: -118,
        NEED_GUARDIAN: -119,
        EOS_DLL_ERROR: -1001,
        EOS_TOKEN_ERROR: -1002,
        GOOGLE_PC_TOKEN_ERROR: -1003
    },
    success: {
        WEB_STANDARD: 200,
        RETCODE: 0,
        REGISTER: 1,
        PAY_LAUNCH: -120
    }
}

const DEFAULT_CONFIG = {
    serverAddress: "127.0.0.1",
    serverPort: 2069,
    serverDomain: "",
    disableRegistration: false,
    allowGuestAccounts: false,
    allowQRCodeLogin: true,
    requireRealname: false,
    verifyAccountEmail: true,
    verifyAccountPassword: true,
    socialLogin: {
        facebook: {
            enabled: true,
            url: "https://google.com"
        },
        twitter: {
            enabled: true,
            url: "https://google.com"
        },
        discordQR: {
            enabled: true,
            url: "http://127.0.0.1:669/Api/login_by_qr",
            callbackUrl: "http://127.0.0.1:669/Api/login_by_qr/callback"
        },

    },
    advanced: {
        weedWackerCompatibility: false,
        disableYSDKGuard: false,
        enableAnnouncePicPopup: true,
        uidPrefix: "8",
        cryptography: {
            accountPasswordHashRounds: 10
        }
    }
}

const DEFAULT_KEYS_CONFIG = {
    signingKey: "./data/keys/SigningKey.pem",
    auth: {
        public: "./data/keys/auth/auth_public_key.pem",
        private: "./data/keys/auth/auth_private_key.pem"
    }
}

const DEFAULT_EMAILMSGS = {
    subject: "AndigenaPS Passport",
    text: "Hello, \nYour verification code is: %verifycode%",
    html: "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"><style>.co_org{color:#e99b00}.mess{width:690px;overflow:hidden;padding:30px;background:#fcfbfb;border:1px solid #eaeaea}.mess a{width:200px;color:#00f;text-decoration:underline;line-height:16px;word-wrap:break-warp;word-break:break-all;font-size:16px}.mess h4{color:#b6b6b6}.mess p{color:#333;line-height:25px}.mess_bot{margin-top:50px}.mess_bot h5{color:#777;border-top:1px solid #666;margin-top:5px;margin-bottom:10px;padding-top:5px}</style><div class=\"mess\"><h3><span style=\"color:#000;font-size:15px\">Hi!</span></h3><span style=\"color:#000;font-size:15px\"></span><p><span style=\"color:#000;font-size:15px\">You are linking your email. Your verification code is:&nbsp;</span><span style=\"color:#000\"><strong><span style=\"color:#4ea4dc;font-size:15px\">%verifycode%</span></strong><span style=\"font-size:15px\">.</span></span></p><span style=\"color:#000;font-size:15px\"></span><p class=\"m_top50\"><span style=\"color:#000;font-size:15px\">Please complete the account verification process in 30 minutes.</span></p><span style=\"color:#000;font-size:15px\"></span><div class=\"mess_bot\"><span style=\"color:#000;font-size:15px\"></span><p><span style=\"color:#000;font-size:15px\">AndigenaPS</span></p><span style=\"color:#000\"></span><h5><span style=\"color:#777;font-size:13px\">This is an automated email. Please do not reply to this email.</span></h5></div></div>"
}

module.exports = {DEFAULT_CONFIG, DEFAULT_KEYS_CONFIG, DEFAULT_EMAILMSGS, EMAIL_REGEX, ActionType, ClientType, loginStatusEnum, preGrantWay, statusCodes, SceneType, PlatformType}
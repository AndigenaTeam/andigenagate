
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

const ActionType = {
    qrode: {
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
    WAY_EMAIL: 'Way_Email'
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
    serverPort: 669,
    disableRegistration: false,
    allowGuestAccounts: false,
    allowQRCodeLogin: true,
    allowRealnameLogin: false,
    verifyAccountEmail: true,
    verifyAccountPassword: true,
    socialLogin: {
        facebook: {
            enabled: true,
            url: "https://discord.gg/gcbackrooms"
        },
        twitter: {
            enabled: true,
            url: "https://google.com"
        },
        discordQR: {
            enabled: true,
            url: "https://discord.com"
        }
    },
    advanced: {
        disableYSDKGuard: false,
        enableAnnouncePicPopup: true,
        cryptography: {
            accountPasswordHashRounds: 10
        }
    }
}

const DEFAULT_KEYS_CONFIG = {
    dispatchKey: "./data/keys/dispatchKey.bin",
    dispatchSeed: "./data/keys/dispatchSeed.bin",
    secretKey: "./data/keys/secretKey.bin",
    signingKey: "./data/keys/SigningKey.pem",
    auth: {
        public: "./data/keys/auth/auth_public_key.pem",
        private: "./data/keys/auth/auth_private_key.pem"
    }
}

module.exports = {DEFAULT_CONFIG, DEFAULT_KEYS_CONFIG, EMAIL_REGEX, ActionType, ClientType, loginStatusEnum, preGrantWay, statusCodes, SceneType}
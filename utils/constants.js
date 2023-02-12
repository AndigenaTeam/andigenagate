
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

const ActionType = {
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
    Unknown: 0,
    IOS: 1,
    Android: 2,
    PC: 3,
    WEB: 4,
    WAP: 5,
    Sony: 6,
    Nintendo: 7,
    CloudAndroid: 8,
    CloudPC: 9,
    CloudiOS: 10
}

const loginStatusEnum = {
    NEW_DEVICE_VERIFY: -448,
    IS_DELETE_ACCOUNT: -447
}

const preGrantWay = {
    WAY_EMAIL: 'Way_Email'
}

const statusCodes = {
    ERROR: -104,
    success: {
        WEB_STANDARD: 200,
        RETCODE: 0,
        REGISTER: 1
    }
}

const DEFAULT_CONFIG = {
    serverAddress: "127.0.0.1",
    serverPort: 669,
    disableRegistration: false,
    socialLogin: {
        facebook: {
            enabled: true,
            url: "https://discord.gg/gcbackrooms"
        },
        twitter: {
            enabled: true,
            url: "https://google.com"
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

module.exports = {DEFAULT_CONFIG, DEFAULT_KEYS_CONFIG, EMAIL_REGEX, ActionType, ClientType, loginStatusEnum, preGrantWay, statusCodes}
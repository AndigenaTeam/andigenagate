# AndigenaGate
Authentication webserver for Andigena.

## Prerequisites
1. MongoDB database server
2. SMTP details for an email account (if you want to verify email addresses)
3. Discord OAuth2 application credentials for `.env` if you plan to allow `QRCode` login
4. Proxy service such as [MITMProxy](https://github.com/AndigenaTeam/andigenaconfigs) / [Fiddler](https://github.com/AndigenaTeam/andigenaconfigs)

## How to use in production
1. Clone/download this repository `git clone https://github.com/AndigenaTeam/andigenagate.git`
2. Copy `.env.example` and rename to `.env`
3. Start your server
4. Server will generate default configuration files
5. Make your configuration changes if needed
6. Start/restart your server
7. **OPTIONAL** If you want to use `SSL/Cloudflare/reverse proxy` you can but make sure to change config urls for `OAuth2` etc... to your domain

## Issues & Contributions
If you want to contribute you are feel free to make a pull request.
If you encounter any issues open an issue under `Issues` tab.
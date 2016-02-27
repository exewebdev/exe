//All API keys and passwords are for example only - DO NOT COMMIT FUNCTIONAL API KEYS TO THIS FILE!!!
var config = {
    //Server config
    host : "localhost",
    port : "8080",
    secret : "supersecretsessionkey",
    fqdn : "localhost",
    //SQL Config
    sql : {
        enabled: true,
        host : "localhost",
        user : "",
        password : "",
        dbname : "txstexe"
    },
    facebook : {
        clientID        : "1526213684358333",
        clientSecret    : "3a219525c461dc70b2b147ffdd32f169"
    },
    mailchimp : {
        apikey : "face0123456789-us12",
        list : "12345"
    },
    paypal : {
        mode : "sandbox",
        client_id : "EBWKjlELKMYqRNQ6sYvFo64FtaRLRR5BdHEESmha49TM",
        client_secret: "EO422dn3gQLgDbuwqTjzrFgFtaRLRR5BdHEESmha49TM"
    },
    stripe : {
        secret : "",
        public : ""
    },
    google : {
        calendar_id : "someuser@example.com"
    },
    //The following should absouletely be turned on in production, and is only if your computer doesn't support bcrypt.
    bcrypt: true
};

module.exports = config;

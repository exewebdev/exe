var config = {
    //Server config
    host : "localhost",
    port : "8080",
    secret : "supersecretsessionkey",
    //SQL Config
    sql : {
        enabled: true,
        host : "localhost",
        user : "pokemonmegamon",
        password : "",
        dbname : "txstexe"
    },
    facebook : {
        clientID        : "1526213684358333",
        clientSecret    : "3a219525c461dc70b2b147ffdd32f169",
        callbackURL     : "https://exe2-pokemonmegaman.c9users.io/login/facebook/callback"
    },
    sendgrid : {
        apikey : "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"
    },
    //The following should absouletely be turned on in production, and is only if your computer doesn't support bcrypt.
    bcrypt: true
};

module.exports = config;

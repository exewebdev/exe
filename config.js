var config = {
    //Server config
    host : "127.0.0.1",
    port : "80",
    secret : "supersecretsessionkey",
    //SQL Config
    sql : {
        enabled: true,
        host : "127.0.0.1",
        user : "txstexe",
        password : "aggies92",
        dbname : "txstexe"
    },
    //The following should absouletely be turned on in production, and is only if your computer doesn't support bcrypt.
    bcrypt: true
};

module.exports = config;

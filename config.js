var config = {
    //Server config
    host : "0.0.0.0",
    port : "80",
    secret : "supersecretsessionkey",
    //SQL Config
    sql : {
        enabled: false,
        host : "localhost",
        user : "pokemonmegaman",
        password : "",
        dbname : "txstexe"
    },
    //The following should absouletely be turned on in production, and is only if your computer doesn't support bcrypt.
    bcrypt: false
};

module.exports = config;
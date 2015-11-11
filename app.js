var config = require("./config/config");
var express = require('express');
var swig = require('swig');
var bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');

// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname);

var sql = mysql.createConnection({
    host : config.sql.host,
    user : config.sql.user,
    password : config.sql.password || "",
    database : config.sql.dbname
});
sql.connect();

app.use(bodyParser.urlencoded({
    extended: true
}));

//Handles membership signup submits.
app.post('/submit', function(req, res) {
    console.log("Recieved entry with value " + 
        req.param('fname') + ',' +
        req.param('initial') + ',' +
        req.param('lname') + ',' +
        req.param('email') + ',' +
        req.param('major') + ',' +
        req.param('classification') + ',' +
        req.param('grad_date') + ',' +
        req.param('tshirt'));
        
        //Checks to see if we already have a user with the entered email
        sql.query("SELECT email FROM Member WHERE email=?", req.param('email'), function(error, rows, fields) {
           if (rows[0] != null) {
                //TODO: Render "error" page.
                res.send("ERROR : Email already exists in database!");
           } else {
                sql.query("INSERT INTO Member (fname, mi, lname, email, major, class, grad_date, tshirt_size, start_date) VALUES (" +
                    '"' + req.param('fname') + '",' +
                    '"' + req.param('initial') + '",' +
                    '"' + req.param('lname') + '",' +
                    '"' + req.param('email') + '",' +
                    '"' + req.param('major') + '",' +
                    '"' + req.param('classification') + '",' +
                    '"' + req.param('grad_date') + '",' +
                    '"' + req.param('tshirt') + '",' +
                    '"' + getFormattedDate() + '")'
             );
             //TODO: Render "success" page.
             res.send("Signup successful!");
           }
        });
    
});

app.use('/css', express.static(__dirname + "/static/css"));
app.use('/js', express.static(__dirname + "/static/js"));
app.use('/images', express.static(__dirname + "/static/images"));

app.get('/:page', function (req,res){
    res.render('static/' + req.params.page);
});

app.get('/Projects/:page', function (req,res){
    res.render('static/Projects/' + req.params.page);
});

app.get('/', function(req, res){
    res.render('static/index.html');
});

//Starts the server
var server = app.listen(process.env.port || config.port, process.env.IP || config.host, function(){
  var addr = server.address();
  console.log('listening on', addr.address + ':' + addr.port);
});

function getFormattedDate() {
    var date = new Date();
    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return (year + '-' + month + '-' + day);
}
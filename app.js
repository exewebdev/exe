var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var mysql = require('mysql');
var sql = mysql.createConnection({
    host : 'localhost',
    user : 'pokemonmegaman',
    database : 'txstexe'
});
sql.connect();

app.use(bodyParser.urlencoded({
    extended: true
}));

//Static files code
app.use(express.static(__dirname));

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
                    getFormattedDate() + ')'
             );
             //TODO: Render "success" page.
             res.send("Signup successful!");
           }
        });
    
});

//Starts the server
var server = app.listen(process.env.port || 8080, process.env.IP || "0.0.0.0", function(){
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
    return year + '-' + month + '-' + day;
}
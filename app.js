var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.sqlite');

app.use(bodyParser.urlencoded({
    extended: true
}));

//SQL Code
db.serialize(function(){
    db.run("CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY,fname TEXT, initial TEXT, lname TEXT, email TEXT, major TEXT, classification TEXT, grad_date INTEGER, tshirt TEXT)");
});

app.use(express.static(__dirname));

app.post('/submit', function(req, res) {
    console.log("Recieved entry with value " + 
        req.param('fname') + ',' +
        req.param('initial') + ',' +
        req.param('lname') + ',' +
        req.param('email') + ',' +
        req.param('major') + ',' +
        req.param('classification') + ',' +
        req.param('tshirt'));
    db.run("INSERT INTO members (fname, initial, lname, email, major, classification, tshirt) VALUES ($fname, $initial, $lname, $email, $major, $classification, $tshirt)",{
        $fname: req.param('fname'),
        $initial: req.param('initial'),
        $lname: req.param('lname'),
        $email: req.param('email'),
        $major: req.param('major'),
        $classification: req.param('classification'),
        $tshirt: req.param('tshirt')
    });
});

//Starts the server
var server = app.listen(process.env.port || 8080, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log('listening on', addr.address + ':' + addr.port);
});
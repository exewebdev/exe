var config = require("./config");
var express = require('express');
var swig = require('swig');
var bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var async = require('async');

var session      = require('express-session');
var flash    = require('connect-flash');

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname);

if (config.sql.enabled){
    var sql = mysql.createConnection({
        host : config.sql.host,
        user : config.sql.user,
        password : config.sql.password || "",
        database : config.sql.dbname
    });
    sql.connect();
} else {
    console.warn("SQL server disabled in config.js.  Signup and login functionality disabled.");
}

app.use(session({
    secret : config.secret,
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
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
        
        if (config.sql.enabled) {
            //Checks to see if we already have a user with the entered email
            sql.query("SELECT email FROM Member WHERE email=?", req.param('email'), function(error, rows, fields) {
               if (rows[0] != null) {
                    //TODO: Render "error" page.
                    res.send("ERROR : Email already exists in database!");
               } else {
                    sql.query("INSERT INTO Member (fname, mi, lname, email, password, major, class, grad_date, tshirt_size, start_date) VALUES (" +
                        '"' + req.param('fname') + '",' +
                        '"' + req.param('initial') + '",' +
                        '"' + req.param('lname') + '",' +
                        '"' + req.param('email') + '",' +
                        '"' + req.param('password') + '",' +
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
        } else {
            res.send("SQL sever not configured, unable to signup.");
        }
});

//Static files not to be passed through the templating engine
app.use('/css', express.static(__dirname + "/static/css"));
app.use('/js', express.static(__dirname + "/static/js"));
app.use('/images', express.static(__dirname + "/static/images"));
app.use('/fonts', express.static(__dirname + "/static/fonts"));

app.get('/forums.html', function(req, res){
    var forum = {categories : []
    };
    sql.query("SELECT * FROM Forum", function(error, rows, fields){
        async.each(rows, function(row, callback){
            var rowIndex = forum.categories.push(row);
            sql.query("SELECT * FROM Topic WHERE forum_id=?", row.forum_id, function(error, rows, fields){
                forum.categories[rowIndex - 1].topics = rows;
                callback();
            });
        }, function (error){
            res.render("static/forums.html", {forum: forum}); 
        });
    });
});

app.get('/login', function(req, res) {
    res.render('./static/login.html', {message: req.flash('error')});
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: 'Incorrect username or password.'})
);

app.get('/favicon.ico', function(req, res){
    res.sendFile('./static/favicon.ico', {root : __dirname});
});


app.get('/:page', function (req,res){
    if (req.isAuthenticated()){
        res.render('./static/' + req.params.page, {name: req.user.fname + " " + req.user.lname});
    } else {
        res.render('./static/' + req.params.page);
    }
});

app.get('/Projects/:page', function (req,res){
   if (req.isAuthenticated()){
        res.render('./static/Projects/' + req.params.page, {name: req.user.fname + " " + req.user.lname});
    } else {
        res.render('./static/Projects/' + req.params.page);
    }
});

app.get('/', function(req, res){
    if (req.isAuthenticated()){
        res.render('./static/index.html', {name: req.user.fname + " " + req.user.lname});
    } else {
        res.render('./static/index.html');
    }
});

//Authentication stuff
passport.use(new localStrategy({
    usernameField: 'user',
    passwordField: 'pass'
  },
  function(username, password, done) {
    console.log("Checking login");
    sql.query("SELECT * FROM Member WHERE email=?", username, function(error, rows, fields){
      if (error) { 
          console.log(error);
          return done(error);
      }
      if (rows[0] == null){
        console.log("Incorrect username");
        return done(null, false, { message: 'Incorrect username.' });
      }
      //TODO:Encrpyt passwords
      if (password != rows[0].password) {
        console.log("Incorrect password");
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, rows[0]);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.member_id);
});

passport.deserializeUser(function(id, done) {
   sql.query("SELECT * FROM Member WHERE member_id=?", id, function(error, rows, fields){
    done(error, rows[0]);
  });
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
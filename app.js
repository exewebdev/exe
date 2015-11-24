var config = require("./config");
var express = require('express');
var swig = require('swig');
var bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var async = require('async');
var validator = require('validator');
if (config.bcrypt === false) {
    console.error("Bcrypt disabled in settings!  Do not use in production!");
}
else {
    var bcrypt = require('bcrypt');
}
var md5 = require('md5');

var session = require('express-session');
var flash = require('connect-flash');

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname);

if (config.sql.enabled) {
    var sql = mysql.createConnection({
        host: config.sql.host,
        user: config.sql.user,
        password: config.sql.password || "",
        database: config.sql.dbname
    });
    sql.connect();
}
else {
    console.warn("SQL server disabled in config.js.  Signup and login functionality disabled.");
}

app.use(session({
    secret: config.secret,
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
            if (error) {
                res.redirect("error.html");
            }
            if (rows[0] !== undefined) {
                //TODO: Render "error" page.
                console.log(rows[0]);
                res.send("ERROR : Email already exists in database!");
            }
            else {
                sql.query("INSERT INTO Member (fname, mi, lname, email, password, major, class, grad_date, tshirt_size, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.param('fname'),
                    req.param('initial'),
                    req.param('lname'),
                    req.param('email'),
                    hashPassword(req.param('password')),
                    req.param('major'),
                    req.param('classification'),
                    req.param('grad_date'),
                    req.param('tshirt'),
                    getFormattedDate()
                ]);
                //TODO: Render "success" page.
                passport.authenticate('local')(req, res, function() {
                    res.redirect("/");
                });
            }
        });
    }
    else {
        res.send("SQL sever not configured, unable to signup.");
    }
});

//Static files not to be passed through the templating engine
app.use('/css', express.static(__dirname + "/static/css"));
app.use('/js', express.static(__dirname + "/static/js"));
app.use('/scripts', express.static(__dirname + "/static/js"));
app.use('/images', express.static(__dirname + "/static/images"));
app.use('/fonts', express.static(__dirname + "/static/fonts"));

app.get("/forums/:name", function(req, res) {
    sql.query("SELECT * FROM Topic WHERE topic_name=?", [req.params.name], function(error, topicrows, fields) {
        if (error) {
            res.redirect("/error.html");
        }
        else if (topicrows[0] === undefined) {
            console.log(req.params.name);
            console.log(topicrows);
            res.redirect("/404.html");
        }
        else {
            //Show only the last 20 posts for a given topic.
            sql.query("SELECT * FROM Thread WHERE topic_id=? ORDER BY datetime DESC LIMIT 20", [topicrows[0].topic_id], function(error, rows, fields) {
                res.render("static/topic.html", {
                    topic: topicrows[0],
                    threads: rows,
                    session: req.user
                });
            });
        }
    });
});

app.get("/forums/:name/newpost", function(req, res){
   res.render("static/newpost.html", {session: req.user}); 
});

app.get("/forums/:topic/:thread", function(req, res){
    sql.query("SELECT * FROM Comment WHERE thread_id=?", [req.params.thread], function(error, rows, fields) {
        res.render("static/thread.html", {
        comments: rows,
        session: req.user
        });
    });
});


//Handles posting new threads
app.post("/forums/:name/newpost", function(req, res){
   if (req.user) {
       //Resolve name into an ID.
       sql.query("SELECT topic_id FROM Topic WHERE topic_name=?", [req.params.name], function(error, topicrows, fields) {
           //Create the thread.
            sql.query("INSERT INTO Thread (thread_name, topic_id, thread_op, datetime) VALUES (?, ?, ?, ?)",
                [req.body.title, 
                topicrows[0].topic_id,
                req.user.fname + " " + req.user.lname,  //Perhaps change to user ID in the future.
                getFormattedDate()
            ], function (error){
                if (error){
                    res.redirect("/error.html");
                } else {
                    //Find the newly generated thread ID.
                    sql.query("SELECT thread_id FROM Thread WHERE thread_name=? ORDER DESC", [req.body.title], function(error, rows){
                        //Post the first comment in the thread.
                        sql.query("INSERT INTO Comment (thread_id, member_id, comment, date) VALUES (?, ?, ?, ?)",
                        [rows[0].thread_id, req.user.member_id, req.body.message, getFormattedDate()],
                        function(error) {
                            //Redirect to the new thread.
                            res.redirect("/forums/" + req.params.name + "/" + rows[0].thread_id + "/");  
                        });
                    });
                }
            });
        });
   } else {
       app.redirect("/login.html");
   }
});

app.post("/newtopic", function(req, res) {
    //checks for logged in user
    if (req.user) {
        //todo: permissions for creating new topics (ideally, restrict to officers)
        //gets the id of the category typed (if none exists, create one)
        sql.query("SELECT forum_id FROM Forum WHERE forum_name=?", [req.body.category], function(error, rows, fields) {
            if (rows[0] == undefined) {
                //create new topic
                sql.query('INSERT INTO Forum (forum_name) VALUES (?)', [req.body.category], function() {
                    sql.query("SELECT forum_id FROM Forum WHERE forum_name=?", [req.body.category], function(error, rows, fields) {
                        sql.query('INSERT INTO Topic (forum_id, topic_name, datetime, topic_description) VALUES (?, ?, ?, ?)', [rows[0].forum_id,
                            req.body.title,
                            getFormattedDate(),
                            req.body.description
                        ], function(error, rows, fields) {
                            if (!error) {
                                res.redirect("forums/" + req.params.title);
                            }
                            else {
                                res.redirect("error.html");
                            }
                        });
                    });
                });
            } else {
                console.log(rows[0]);
                sql.query('INSERT INTO Topic (forum_id, topic_name, datetime, topic_description) VALUES (?, ?, ?, ?)', [rows[0].forum_id,
                        req.body.title,
                        getFormattedDate(),
                        req.body.description
                    ],
                    function(error, rows, fields) {
                        if (!error) {
                            res.redirect("forums/" + req.params.title);
                        }
                        else {
                            res.redirect("error.html");
                        }
                    });
            }
        });
    }
    else {
        res.redirect("/login.html");
    }
});

app.get('/profile/:id/edit', function(req, res) {
    //checks for authorization before editing a profile page
    if (req.user.member_id != req.params.id) {
        res.render("static/403.html");
    }
    else {
        res.render("static/editprofile.html", {
            session: req.user
        });
    }
});

app.get('/profile/:name', function(req, res) {
    var names = req.params.name.split(" ");
    sql.query('SELECT * FROM Member WHERE fname=? AND lname=?', [names[0], names[1]], function(error, rows, fields) {
        if (error) {
            res.redirect('/error.html');
        }
        if (rows[0] === undefined) {
            res.redirect('/404.html');
        }
        else {
            rows[0].emailHash = md5sum(rows[0].email);
            res.render('./static/profile.html', {
                session: req.user,
                user: rows[0]
            });
        }
    });
});

//Handles profile edits.
app.post('/profile/:id/edit', function(req, res) {
    if (req.params.id != req.user.member_id) {
        res.redirect("/403.html");
    }
    else {
        //TODO: Check for email collision before SQL update
        sql.query("UPDATE Member SET fname=?, mi=?, lname=?, email=?, password=?, major=?, class=?, grad_date=?, tshirt_size=? WHERE member_id=?", [req.param('fname'),
                req.param('initial'),
                req.param('lname'),
                req.param('email'),
                hashPassword(req.param('password')),
                req.param('major'),
                req.param('classification'),
                req.param('grad_date'),
                req.param('tshirt'),
                req.user.member_id
            ],
            function(error) {
                if (error) {
                    console.error(error);
                    res.redirect('/error.html');
                }
                else {
                    //Recreate session with new password and email, then render profile page.
                    req.logout();
                    passport.authenticate('local')(req, res, function() {
                        res.redirect('/profile/' + req.user.fname + ' ' + req.user.lname);
                    });
                }
            });
    }
});

app.get('/forums.html', function(req, res) {
    var forum = {
        categories: []
    };
    sql.query("SELECT * FROM Forum", function(error, rows, fields) {
        async.each(rows, function(row, callback) {
            var rowIndex = forum.categories.push(row);
            sql.query("SELECT * FROM Topic WHERE forum_id=?", row.forum_id, function(error, rows, fields) {
                forum.categories[rowIndex - 1].topics = rows;
                callback();
            });
        }, function(error) {
            res.render("static/forums.html", {
                forum: forum,
                session: req.user
            });
        });
    });
});

app.get('/login', function(req, res) {
    res.render('./static/login.html', {
        message: req.flash('error')
    });
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: 'Incorrect username or password.'
    })
);

app.get('/:page', function(req, res) {
    if (req.isAuthenticated()) {
        res.render('./static/' + req.params.page, {
            session: req.user
        });
    }
    else {
        res.render('./static/' + req.params.page);
    }
});

app.get('/Projects/:page', function(req, res) {
    if (req.isAuthenticated()) {
        res.render('./static/Projects/' + req.params.page, {
            session: req.user
        });
    }
    else {
        res.render('./static/Projects/' + req.params.page);
    }
});

app.get('/', function(req, res) {
    if (req.isAuthenticated()) {
        res.render('./static/index.html', {
            session: req.user
        });
    }
    else {
        res.render('./static/index.html');
    }
});

app.use(function(req, res) {
    if (req.isAuthenticated()) {
        res.render('./static/404.html', {
            session: req.user
        });
    }
    else {
        res.render('./static/404.html');
    }
});

//Authentication stuff
passport.use(new localStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(username, password, done) {
        console.info("Checking login");
        sql.query("SELECT * FROM Member WHERE email=?", username, function(error, rows, fields) {
            if (error) {
                console.log(error);
                return done(error);
            }
            if (!rows[0]) {
                console.info("Incorrect username");
                return done(null, false, {
                    message: 'Incorrect username.'
                });
            }
            if (config.bcrypt === false) { //Bypass encryption (ONLY for development.)
                if (password == rows[0].password) {
                    console.info("Incorrect password");
                    return done(null, false, {
                        message: 'Incorrect password.'
                    });
                }
            }
            else if (!bcrypt.compareSync(password, rows[0].password)) {
                console.info("Incorrect password");
                return done(null, false, {
                    message: 'Incorrect password.'
                });
            }
            return done(null, rows[0]);
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.member_id);
});

passport.deserializeUser(function(id, done) {
    sql.query("SELECT * FROM Member WHERE member_id=?", id, function(error, rows, fields) {
        //We'll also add the MD5 hash of the password to the session object (for use in gravatars).
        rows[0].emailHash = md5sum(rows[0].email);
        done(error, rows[0]);
    });
});

//Starts the server
var server = app.listen(process.env.port || config.port, process.env.IP || config.host, function() {
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

function hashPassword(password) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
}

function md5sum(text) {
    return md5(text);
}

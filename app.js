var config = require("./config");
var db = require("./lib/dbhelper");
var express = require('express');
var swig = require('swig');
var bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var facebookStrategy = require("passport-facebook").Strategy;
var ensureLogin = require("connect-ensure-login").ensureLoggedIn;
var async = require('async');
var gcal = require('./lib/gcalhelper');

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
    if (process.env.CLEARDB_DATABASE_NAME){ //for heroku's cleardb
        var sql = mysql.createConnection(process.env.CLEARDB_DATABASE_NAME);
    } else {
        var sql = mysql.createConnection({
            host: process.env.DATABASE_HOST || config.sql.host,
            user: process.env.DATABASE_USER || config.sql.user,
            password: process.env.DATABASE_PASSWORD || config.sql.password || "",
            database: process.env.DATABASE_NAME || config.sql.dbname
        });
    }
    sql.connect();
}
else {
    console.warn("SQL server disabled in config.js.  Signup and login functionality disabled.");
}

app.use(session({
    secret: process.env.SESSION_SECRET || config.secret,
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
    var user = {  
        fname : req.body.fname,
        mi : req.body.initial,
        lname : req.body.lname,
        email : req.body.email,
        email_hash : md5sum(req.body.email),
        major : req.body.major,
        'class' : req.body.classification,
        grad_date : req.body.grad_date,
        tshirt_size : req.body.tshirt
    };
    var pass = hashPassword(req.body.password);
    console.info("Recieved entry with value " + user);
    db.addNewUser(user, pass, function(error){
        if (error){
            console.log(error);
            res.redirect("/join.html");
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/');
            });
        }
    });
});

//Static files not to be passed through the templating engine
app.use('/css', express.static(__dirname + "/static/css"));
app.use('/js', express.static(__dirname + "/static/js"));
app.use('/scripts', express.static(__dirname + "/static/js"));
app.use('/images', express.static(__dirname + "/static/images"));
app.use('/fonts', express.static(__dirname + "/static/fonts"));
app.get('/favicon.ico', function(req, res){
   res.sendfile(__dirname + '/static/favicon.ico');
});

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
            console.log(topicrows[0].topic_id);
            //Show only the last 20 posts for a given topic.
            sql.query("SELECT op.fname AS opfname, op.lname AS oplname, lastpost.*, lastuser.fname, lastuser.lname, Thread.thread_name, Thread.datetime AS opdatetime, Thread.post_count FROM Thread " + 
            "INNER JOIN Member AS op ON op.member_id=Thread.thread_op_id " +
            "INNER JOIN Comment AS lastpost ON lastpost.comment_id=Thread.last_post_id " +
            "INNER JOIN Member AS lastuser ON lastuser.member_id = lastpost.member_id " +
            "WHERE topic_id=? ORDER BY lastpost.datetime DESC LIMIT 20", [topicrows[0].topic_id], function(error, rows, fields) {
                if (error){
                    console.log(error);
                } else {
                    console.log(rows[0]);
                    res.render("static/topic.html", {
                        topic: topicrows[0],
                        threads: rows,
                        session: req.user
                    });
                }
            });
        }
    });
});

app.post("/newevent", ensureLogin("/login"), function(req, res){
    if (req.user.privs < 1){
        res.redirect("/403.html");
    } else {
        console.log(req.body.startdate);
        gcal.addEvent(
            req.body.name,
            new Date(req.body.startdate),
            new Date(req.body.enddate),
            req.body.location,
            req.body.description,
            req.body.points,
            req.body.password,
            function(err){
                if (err){
                    console.log(err);
                    res.redirect('/error.html');
                } else {
                    res.redirect('/events.html');
                }
            }
        );
    }
});

//Handles event logins
app.post("/eventlogin", ensureLogin("/login"), function(req, res){
    //Queries the google calendar for the event happening currently
    gcal.getCurrentEvent(function (error, event){
       if (!error && event){
           if (req.body.password == event.extendedProperties.private.password){
               //Add user to attended table, and increment user's points by the point value for the event.
               db.checkInUser(req.user, event, function(error){
                   if (error){
                       console.log(error);
                       res.redirect("/error.html");
                   } else {
                       res.redirect("/profile/" + req.user.fname + " " + req.user.lname);
                   }
               });
           }
       } else {
           console.log(error);
           res.redirect("/error.html");
       }
    });
});

app.get("/forums/:name/newpost", ensureLogin("login.html"), function(req, res){
   res.render("static/newpost.html", {session: req.user}); 
});

app.get("/forums/:topic/:thread/reply", ensureLogin("/login.html"), function(req, res){
    //Checks for login.
    if (req.user){
        res.render("static/reply.html", {session: req.user});
    } else {
        res.redirect("/login.html");
    }
});

//Handles posting thread replies.
app.post("/forums/:topic/:thread/reply", function(req, res){
    //Checks for login.
    if (req.user){
        //TODO: Check to make sure thread exists.
        //Create the post.
        var comment = {thread_id:req.params.thread, 
            member_id:req.user.member_id,
            comment:req.body.message};
        db.postComment(comment, function() {
            res.redirect("/forums/" + req.params.topic + "/" + req.params.thread + "/");    
        });

    } else {
        res.redirect("/login.html");
    }
});

//Handles threads.
app.get("/forums/:topic/:thread", function(req, res){
    //Gets topics
    sql.query("SELECT * FROM Comment INNER JOIN Member ON Comment.member_id = Member.member_id WHERE thread_id=?", [req.params.thread], function(error, rows, fields) {
        if (error){
            console.log(error);
            res.redirect("/error.html");
        } else {
            res.render("static/thread.html", {
            posts: rows,
            session: req.user
            });
        }
    });
});


//Handles posting new threads
app.post("/forums/:name/newpost",  ensureLogin("/login"), function(req, res){
   if (req.user) {
       //Resolve name into an ID.
       sql.query("SELECT topic_id FROM Topic WHERE topic_name=?", [req.params.name], function(error, topicrows, fields) {
           //Create the thread.
            sql.query("INSERT INTO Thread (thread_name, topic_id, thread_op_id) VALUES (?, ?, ?)",
                [req.body.title, 
                topicrows[0].topic_id,
                req.user.member_id
            ], function (error){
                if (error){
                    console.log(error);
                    res.redirect("/error.html");
                } else {
                    //Find the newly generated thread ID.
                    sql.query("SELECT thread_id FROM Thread WHERE thread_name=? ORDER BY thread_id DESC", [req.body.title], function(error, rows){
                        if (error){
                                console.log(error);
                                res.redirect("/error.html");
                            }
                        //Post the first comment in the thread.
                        var comment = {thread_id:rows[0].thread_id, member_id:req.user.member_id, comment:req.body.message};
                        db.postComment(comment, function(){
                            //Redirect to the new thread.
                            res.redirect("/forums/" + req.params.name + "/" + rows[0].thread_id + "/");
                        });
                    });
                }
            });
        });
   } else {
       res.redirect("/login.html");
   }
});

//Handles creating new topics.
app.post("/newtopic", function(req, res) {
    //checks for logged in user
    if (req.user) {
        //todo: permissions for creating new topics (ideally, restrict to officers)
        //gets the id of the category typed (if none exists, create one)
        sql.query("SELECT forum_id FROM Forum WHERE forum_name=?", [req.body.category], function(error, rows, fields) {
            if (rows[0] === undefined) {
                //create new topic
                sql.query('INSERT INTO Forum (forum_name) VALUES (?)', [req.body.category], function() {
                    sql.query("SELECT forum_id FROM Forum WHERE forum_name=?", [req.body.category], function(error, rows, fields) {
                        sql.query('INSERT INTO Topic (forum_id, topic_name, topic_description) VALUES (?, ?, ?)', [rows[0].forum_id,
                            req.body.title,
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
                sql.query('INSERT INTO Topic (forum_id, topic_name, topic_description) VALUES (?, ?, ?)', [rows[0].forum_id,
                        req.body.title,
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

app.get('/profile/:id/edit', ensureLogin("/login"), function(req, res) {
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
        var user = {  
        fname : req.body.fname,
        mi : req.body.initial,
        lname : req.body.lname,
        email : req.body.email,
        email_hash : md5sum(req.body.email),
        major : req.body.major,
        'class' : req.body.classification,
        grad_date : req.body.grad_date,
        tshirt_size : req.body.tshirt,
        password : hashPassword(req.body.password)
    };
    sql.query("UPDATE Member INNER JOIN Credential ON Credential.member_id=Member.member_id SET ? WHERE Member.member_id=?",
    [user, req.params.id],
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

app.get('/login/facebook', passport.authenticate('facebook', {scope: 'email'}));

app.get('/login/facebook/callback', passport.authenticate('facebook', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login'
}));

app.post('/login',
    passport.authenticate('local', {
        successReturnToOrRedirect: '/',
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
        sql.query("SELECT * FROM Member JOIN Credential ON Credential.member_id = Member.member_id WHERE Email=?", username, function(error, rows, fields) {
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
            if (bcrypt === false) { //Bypass encryption (ONLY for development.)
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
        done(error, rows[0]);
    });
});

passport.use(new facebookStrategy({
    clientID : process.env.FB_CLIENTID || config.facebook.clientID,
    clientSecret : process.env.FB_CLIENTSECRET || config.facebook.clientSecret,
    callbackURL : process.env.FB_CALLBACKURL || config.facebook.callbackURL,
    profileFields: ["id", "birthday", "first_name", "last_name", "gender", "picture.width(200).height(200)",'email']
},
function(token, refreshToken, profile, done) {
    sql.query("SELECT * FROM Member WHERE facebook_id=?", [profile.id], function(error, rows){
       if (error){
          return done(error);
       } else if (rows[0]){ //User is already authenticated with facebook
           return done(null, rows[0]);
       } else {
           console.log(profile);
           var user = {
               facebook_id : profile.id,
               facebook_token : token,
               fname : profile.name.givenName,
               lname : profile.name.familyName,
               email : profile.emails[0].value,
               email_hash : md5sum(profile.emails[0].value),
           };
           db.addNewUser(user, null, function(user){
               return done(null, user);
           }, function(){
               throw new error("Something didn't work!");  //Best error message ever
           });
       }
    });
}));

//Starts the server
var server = app.listen(process.env.port || config.port, process.env.IP || config.host, function() {
    var addr = server.address();
    console.log('listening on', addr.address + ':' + addr.port);
});

/*function getFormattedDate() {
    var date = new Date();
    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return (year + '-' + month + '-' + day);
}*/

function hashPassword(password) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
}

function md5sum(text) {
    return md5(text);
}

/*function ensureLogin(url){
    return function(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      if (req.session) {
        req.session.returnTo = req.originalUrl || req.url;
      }
      return res.redirect(url);
    }
    next();
  }
}*/
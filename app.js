var config = require("./config");
var db = require("./lib/dbhelper");
var express = require('express');
var swig = require('swig');
var bodyParser = require('body-parser');
var app = express();
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
        db.getTopicByName(req.params.name, function(error, topic){
            if (error){
                console.log(error);
                res.redirect("error.html");
            } else if (!topic) {
                res.redirect("404.html");
            } else {
            console.log(topic.topic_id);
            //Show only the last 20 posts for a given topic.
            db.getTopicPosts(topic.topic_id, 20, function(error, rows) {
                if (error){
                    console.log(error);
                } else {
                    console.log(rows[0]);
                    res.render("static/topic.html", {
                        topic: topic,
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
        var comment = {
            thread_id : req.params.thread, 
            member_id : req.user.member_id,
            comment : req.body.message,
            datetime: (new Date())
        };
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
    db.getThreadComments(req.params.thread, 20, function(error, rows){
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
       db.getTopicByName(req.params.name, function(error, topic) {
           //Create the thread.
            db.createThread(topic.topic_id, req.body.title, req.user.member_id, function (error, thread){
                if (error){
                    console.log(error);
                    res.redirect("/error.html");
                } else {
                    //Post the first comment in the thread.
                    var comment = {
                        thread_id:thread.thread_id,
                        member_id:req.user.member_id,
                        comment:req.body.message,
                        datetime:(new Date())
                    };
                    db.postComment(comment, function(error){
                        if (error){ console.log(error);}
                        //Redirect to the new thread.
                        res.redirect("/forums/" + req.params.name + "/" + thread.thread_id + "/");
                    });
                }
            });
        });
   } else {
       res.redirect("/login.html");
   }
});

//Handles creating new topics.
app.post("/newtopic", ensureLogin("/login"), function(req, res) {
        //restrict to admins
        if (req.user.privs > 0){
        //gets the id of the category typed (if none exists, create one)
        var topic = {
            category: req.body.category,
            title: req.body.title,
            description: req.body.description
        };
        db.createTopic(topic, function(error){
            if (error) {
                console.log(error);
                res.redirect("error.html");
            } else {
                res.redirect("forums/" + req.body.title);
            }
        });
    } else {
        res.redirect("/403.html");
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
    db.getUserByName(names[0], names[1], function(error, user){
        if (error) {
            res.redirect('/error.html');
        } else if (user === undefined) {
            res.redirect('/404.html');
        } else {
            res.render('./static/profile.html', {
                session: req.user,
                user: user
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
        };
        //If password not supplied, do not update password.
        if (req.body.password) {
            user.password = hashPassword(req.body.password);
        }
        db.updateUser(req.params.id, user, function(error) {
            if (error) { 
                console.error(error);
                res.redirect('/error.html');
            } else {
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
    db.getCategories(function(error, rows){
        async.each(rows, function(row, callback) {
            var rowIndex = forum.categories.push(row);
            db.getCategoryTopics(row.forum_id, function(error, rows) {
                if (error){
                    console.log(error);
                }
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
        //Looks up user by email.
        db.getUserByEmail(username, function(error, user){
            if (error) {
                console.log(error);
                return done(error);
            }
            if (!user) {
                console.info("Incorrect username");
                return done(null, false, {
                    message: 'Incorrect username.'
                });
            } else {
                //Gets password hash for user.
                db.getPasswordHash(user.member_id, function(error, storedpassword){
                    if (error) {
                        console.log(error);
                        return done(error);
                    } else {
                        if (bcrypt === false) { //Bypass encryption (ONLY for development.)
                            if (password !== storedpassword) {
                                console.info("Incorrect password");
                                return done(null, false, {
                                    message: 'Incorrect password.'
                                });
                            }
                        } else if (!bcrypt.compareSync(password, storedpassword)) {
                            console.info("Incorrect password");
                            return done(null, false, {
                            message: 'Incorrect password.'
                        });
                    }
                    return done(null, user);
                }
            });
        }
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user.member_id);
});

passport.deserializeUser(function(id, done) {
    db.getUserById(id, done);
});

passport.use(new facebookStrategy({
    clientID : process.env.FB_CLIENTID || config.facebook.clientID,
    clientSecret : process.env.FB_CLIENTSECRET || config.facebook.clientSecret,
    callbackURL : process.env.FB_CALLBACKURL || config.facebook.callbackURL,
    profileFields: ["id", "birthday", "first_name", "last_name", "picture.width(200).height(200)",'email']
},
function(token, refreshToken, profile, done) {
    db.getUserByFacebookId(profile.id, function(error, user){
       if (error){
          return done(error);
       } else if (user){ //User is already authenticated with facebook
           return done(null, user);
       } else {
           console.log(profile);
           var newuser = {
               facebook_id : profile.id,
               facebook_token : token,
               fname : profile.name.givenName,
               lname : profile.name.familyName,
               email : profile.emails[0].value,
               email_hash : md5sum(profile.emails[0].value),
               start_date: (new Date())
           };
           db.addNewUser(newuser, null, function(error, user){
               if (error){
                    console.log(error);
                    return done(error);
               } else {
                    return done(null, user);
               }
           });
       }
    });
}));

//Starts the server
var server = app.listen(process.env.port || process.env.PORT || config.port, process.env.IP || config.host, function() {
    var addr = server.address();
    console.log('listening on', addr.address + ':' + addr.port);
});

function hashPassword(password) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
}

function md5sum(text) {
    return md5(text);
}
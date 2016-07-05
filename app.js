var config = require("./config");
var db = require("./lib/dbhelper");
var paypal = require("./lib/paypal");
var stripe = require("./lib/stripe");
var express = require('express');
var swig = require('swig');
var bodyParser = require('body-parser');
var app = express();
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var facebookStrategy = require("passport-facebook").Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var ensureLogin = require("connect-ensure-login").ensureLoggedIn;
var async = require('async');
var gcal = require('./lib/gcalhelper');
var mail = require('./lib/mailhelper');

//it's difficult for some windows systems to install bcrypt, so give option to disable (NEVER in production)
if (config.bcrypt === false) {
    console.error("Bcrypt disabled in settings!  Do not use in production!");
}
else {
    var bcrypt = require('bcryptjs');
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
        grad_date : new Date(req.body.grad_date),
        tshirt_size : req.body.tshirt,
        subscribe : req.body.subscribe
    };
    var pass = hashPassword(req.body.password);
    console.info("Received entry with value " + user.email);
    db.addNewUser(user, pass, function(error){
        if (error){
            console.log(error);
            res.redirect("/join.html");
        } else {
            if (req.body.subscribe) mail.subscribeUser(user);
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
app.get('/robots.txt', function(req, res){
   res.sendfile(__dirname + '/static/robots.txt');
});
app.get('/sitemap.xml', function(req, res){
   res.sendfile(__dirname + '/static/sitemap.xml');
});
app.get('/favicon.ico', function(req, res){
   res.sendfile(__dirname + '/static/favicon.ico');
});

app.get("/forums/:name", function(req, res) {
    db.getTopicByName(req.params.name, function(error, topic){
        if (error){
            console.log(error);
            res.redirect("/error.html");
        } else if (!topic) {
            res.redirect("/404.html");
        } else {
            //Show only the last 20 posts for a given topic.
            res.render("static/topic.html", {
                topic: topic,
                threads: topic.Threads,
                session: req.user
            });
        }
    });
});
app.post("/newevent", ensureLogin("/login.html"), function(req, res){
    if (req.user.privs < 1){
        res.redirect("/403.html");
    } else {
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
app.post("/eventlogin", ensureLogin("/login.html"), function(req, res){
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

app.get("/:var(roster|roster.html)", ensureLogin("/login"), function(req,res){
    if (req.user.privs < 1){
        res.redirect("/403.html");
    } else {
        db.getAllUsers(function(err, users){
            if (err){
                res.redirect("error.html");
            } else {
                res.render("static/roster.html", {members: users, session: req.user});
            }
        });
    }
});

app.get("/pay", ensureLogin("/login"), function(req, res){
    res.render("static/pay.html",{
        session: req.user,
        stripe: {public_key: process.env.STRIPE_PUBLIC || config.stripe.public || "pk_test_eqCxZfI6l6UfjOvtovUPdhYT"}
    });
});

app.get("/pay.html", ensureLogin("/login"), function(req, res){
    res.render("static/pay.html",{
        session: req.user,
        stripe: {public_key: process.env.STRIPE_PUBLIC || config.stripe.public || "pk_test_eqCxZfI6l6UfjOvtovUPdhYT"}
    });
});

app.post("/pay/stripe", ensureLogin("/login"), function(req, res){
    var stripeToken = req.body.stripeToken;
    req.session.paymentId = 'stripe'; //for the success page
    stripe.executePayment(stripeToken, function(error){
        if (error){
            res.redirect('/error.html');
        } else {
            db.updateUser(req.user.member_id, {paid: 1}, function(error) {
                    if (error){ //very bad
                        console.error(error);
                        res.send("Your payment has been processed, but was not registered on our database." +
                        "<br> Please contact an officer and we will resolve this.");
                    } else {
                        res.redirect('/paymentsuccess');
                    }
            });
        }
    });
});

app.get("/pay/paypal", ensureLogin("/login"), function(req, res){
    paypal.payDues(req.user, function(error, payment){
        req.session.paymentId = payment.id;
        res.redirect(payment.links[1].href);
    });
});

app.get("/pay/return", function(req, res) {
   if (req.session.paymentId && req.session.paymentId === req.query.paymentId){
       paypal.executePayment(req.query.PayerID, req.query.paymentId, function(error){
            if (error){
               console.error(error);
               res.redirect('/error.html');
            } else {
               db.updateUser(req.user.member_id, {paid: 1}, function(error) {
                    if (error){ //very bad
                        console.error(error);
                        res.send("Your payment has been processed, but was not registered on our database." +
                        "<br> Please contact an officer and we will resolve this.");
                    } else {
                        res.redirect('/paymentsuccess');
                    }
                });
            }
        });
   }
});

app.get("/paymentsuccess", function(req, res){
    if (req.session.paymentId){
        req.session.paymentId = null;
        res.render('static/paymentsuccess.html');
    } else {
        res.redirect("/403.html");
    }
});

app.get("/pay/cancel", function(req, res) {
    req.session.paymentId = null;
    res.redirect("/");
});

app.get("/forums/:name/newpost", ensureLogin("/login.html"), function(req, res){
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
    //Gets thread comments
    db.getThread({thread_id : req.params.thread}, function(err, thread){
        res.render("static/thread.html", {
            thread: thread,
            topic: {
                topic_name : req.params.topic
            },
            posts: thread.Comments,
            session: req.user
        });
    });
});



//Handles posting new threads
app.post("/forums/:name/newpost",  ensureLogin("/login"), function(req, res){
    //Resolve name into an ID.
    db.getTopicByName(req.params.name, function(error, topic) {
       //Create the thread.
       var comment = {
            member_id:req.user.member_id,
            comment:req.body.message,
            datetime:(new Date())
        };
        db.createThread(topic.topic_id, req.body.title, req.user.member_id, comment, function (error, thread){
            res.redirect("/forums/" + req.params.name + "/" + thread.thread_id + "/");
        });
    });
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
                res.redirect("/error.html");
            } else {
                res.redirect("/forums/" + req.body.title);
            }
        });
    } else {
        res.redirect("/403.html");
    }
});

app.get('/profile/:id/edit', ensureLogin("/login"), function(req, res) {
    //checks for authorization before editing a profile page
    if (req.user.member_id != req.params.id && req.user.privs === 0) {
        res.render("static/403.html");
    }
    else {
        db.getUserById(req.params.id, function(err, user){
            if (err){
                res.redirect("/error.html");
            }
            res.render("static/editprofile.html", {
                session: req.user,
                user: user
            });
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

app.post('/fbupdate', ensureLogin("/login"), function(req, res){
    var user = {  
        major : req.body.major,
        'class' : req.body.classification,
        grad_date : req.body.grad_date,
        tshirt_size : req.body.tshirt,
    };
    db.updateUser(req.user.member_id, user, function(error) {
        if (req.body.subscribe) mail.subscribeUser(req.user);
        res.redirect("/");
    });
});

// Handles profile edits.
app.post('/profile/:id/editprofile', function(req, res) {
    if (req.params.id != req.user.member_id && req.user.privs < 1) {
        res.redirect("/403.html");
    }
    else {
        var user = req.body;
        if (!req.body.subscribe) user.subscribe = 0; //marks user as unsubscribed if box not checked
        //admin powers
        if (req.user.privs >= 1){
            if (!req.body.privs) user.privs = 0; //demote user
            if (!req.body.paid) user.paid = 0; //remove payment from user
        } else { //clear paid and privs from all non-admin requests
            delete user.paid;
            delete user.privs;
        }
        //remove blank values from update
        for (var key in user){
            if (user[key] === ''){
                delete user[key];
            }
        }
        if (user.grad_date) user.grad_date = new Date(user.grad_date); //converts grad date into JS friendly format
        //If password not supplied, do not update password.
        if (req.body.password) {
            user.password = hashPassword(req.body.password);
        }
        var doUpdate = function(){ 
            db.updateUser(req.params.id, user, function(error) {
                if (error) { 
                    console.error(error);
                    res.redirect('/error.html');
                } else {
                    //Fetches new user profile data.
                    db.getUserById(req.params.id, function(err, user) {
                        //Subscribes or unsubscribes user.
                        if (req.body.subscribe && user.subscribe === false) mail.subscribeUser(req.user);
                        if (!req.body.subscribe && user.subscribe === true) mail.unsubscribeUser(req.user);
                        //Recreate session if current user is user being updated.
                        if (req.params.id === req.user.member_id){
                            //Recreate session with new password and email, then render profile page.
                            req.logout();
                            if (err) {
                                console.log(err);
                                res.redirect("/error.html");   
                            } else {
                                req.login(user, function(err){
                                    if (err) {
                                        console.log(err);
                                        res.redirect("/error.html");   
                                    } else {
                                        res.redirect('/profile/' + user.fname + ' ' + user.lname);
                                    }
                                });
                            }
                        } else {
                            res.redirect('/profile/' + user.fname + ' ' + user.lname);
                        }
                    });
                }
            });
        };
        //If email is being updated, ensure no other user owns email.
        if (user.email){
            db.getUserByEmail(user.email, function(error, member){
                if (member && member.member_id === req.params.id){
                    console.error("ERROR: Email collision " + member.member_id + " " + req.params.id);
                    res.redirect("/error.html");
                } else {
                    doUpdate();
                }
            });
        } else {
            doUpdate();
        }
    }
});

app.get('/forums.html', function(req, res) {
    db.getCategories(function(forum) {
        res.render("static/forums.html", {
            forum: forum,
            session: req.user
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

app.get('/txstlogin', function(req, res) {
    res.render('./static/txstlogin.html', {
        message: req.flash('error'),
        callbackURL: "https://" + (process.env.FQDN || config.fqdn || "localhost") + "/login/txstate/callback"
    });
});

app.get('/login/facebook', passport.authenticate('facebook', {scope: 'email'}));

app.get('/login/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/login' }),
  function(req, res) {
    //if just signed up, req.user.new = true;
    if (req.user.new === true){
        res.redirect('/fbcompletesignup.html');
    } else if(req.session.returnTo !== undefined){
        var url = req.session.returnTo;
        req.session.returnTo = undefined;
        res.redirect(url);
    } else {
        res.redirect("/");
    }
});

app.get('/login/txstate/callback', passport.authenticate('jwt', {failureRedirect: '/txstlogin.html'}),
    function(req, res) {
        //if just signed up, req.user.new = true;
    if (req.user.new === true){
        res.redirect('/fbcompletesignup.html');
    } else if(req.session.returnTo !== undefined){
        var url = req.session.returnTo;
        req.session.returnTo = undefined;
        res.redirect(url);
    } else {
        res.redirect("/");
    }
});

app.post('/login',
    passport.authenticate('local', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/login',
        failureFlash: 'Incorrect username or password.'
    })
);
//Uses a JWT token to authenticate a request.

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

app.get('/career/:page', function(req, res) {
    if (req.isAuthenticated()) {
        res.render('./static/career/' + req.params.page, {
            session: req.user
        });
    }
    else {
        res.render('./static/career/' + req.params.page);
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
    callbackURL : "https://" + (process.env.FQDN || config.fqdn || "localhost") + "/login/facebook/callback",
    profileFields: ["id", "birthday", "first_name", "last_name", "picture.width(200).height(200)",'email']
},
function(token, refreshToken, profile, done) {
    db.getUserByFacebookId(profile.id, function(error, user){
       if (error) {
          return done(error);
       } else if (user) { //User is already authenticated with facebook
           return done(null, user);
       } else {
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
                    //adds a new tag to user, so we can redirect to finish registration page
                    user.new = true;
                    return done(null, user);
               }
           });
       }
    });
}));

//JWT (aka Luke's Texas State API) based authentication.
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromUrlQueryParameter('jwt');
opts.secretOrKey = process.env.JWT_SECRET || config.txst.secret || "secret";
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    //Query for the email in the database.
    //Since this is a Texas State Email, it is OK if they have an account already - we know it belongs to them.
    db.getUserByEmail(jwt_payload.email, function(err, user) {
        if (err) {
            console.error(err);
            return done(err, false);
        }
        if (user) {
            done(null, user);
        } else {
            //Create a new account
            var newuser = {
               fname : jwt_payload.fname,
               lname : jwt_payload.lname,
               email : jwt_payload.email,
               email_hash : md5sum(jwt_payload.email),
               start_date: (new Date())
            };
           db.addNewUser(newuser, null, function(error, user){
               if (error){
                    console.log(error);
                    return done(error);
               } else {
                    //adds a new tag to user, so we can redirect to finish registration page
                    user.new = true;
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
    return bcrypt.hashSync(password, salt);
}

function md5sum(text) {
    return md5(text);
}
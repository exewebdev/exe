//Various MySQL databse helpers.
var mysql = require('../node_modules/mysql');
var config = require('../config');

if (config.sql.enabled) {
    if (process.env.CLEARDB_DATABASE_URL){ //for heroku's cleardb-
        var pool = mysql.createPool(process.env.CLEARDB_DATABASE_URL);
        //var sql = mysql.createConnection(process.env.CLEARDB_DATABASE_URL);
    } else {
        var pool = mysql.createPool({
        //var sql = mysql.createConnection({
            host: process.env.DATABASE_HOST || config.sql.host,
            user: process.env.DATABASE_USER || config.sql.user,
            password: process.env.DATABASE_PASSWORD || config.sql.password || "",
            database: process.env.DATABASE_NAME || config.sql.dbname
        });
    }
    //sql.connect();
}
else {
    console.warn("SQL server disabled in config.js.  Signup and login functionality disabled.");
}

//This is a wrapper for the SQL function to create and relerase connections from the pool.
var sql = {
    query: function () {
        var queryArgs = Array.prototype.slice.call(arguments),
            events = [],
            eventNameIndex = {};

        pool.getConnection(function (err, conn) {
            if (err) {
                if (eventNameIndex.error) {
                    eventNameIndex.error();
                }
            }
            if (conn) { 
                var q = conn.query.apply(conn, queryArgs);
                q.on('end', function () {
                    conn.release();
                });

                events.forEach(function (args) {
                    q.on.apply(q, args);
                });
            }
        });

        return {
            on: function (eventName, callback) {
                events.push(Array.prototype.slice.call(arguments));
                eventNameIndex[eventName] = callback;
                return this;
            }
        };
    }
};

//Adds an event to the calendar db, and returns the ID of the created event to a callback.
exports.addEvent = function(name, password, id, callback){
    event = {
        event_name : name,
        event_password : password,
        event_id: id
    };
    sql.query("INSERT INTO Event SET ?", event, function(error) {
        if (error){
            callback(error);
        } else {
            callback();
        }
    });
};

//"Checks-in" a user, i.e gives the user points based on the point valeu of the specified event.
//Params: user to add point, event form google calendar, callbackk
exports.checkInUser = function(user, event, callback){
    exports.getUserByName(user.fname, user.lname, function(error, user){
        if (error){
            callback(error);
        } else {
            //Checks to see if user has larerady checked-in for an event.
            sql.query("SELECT member_id FROM Signup WHERE member_id=? AND event_id=?", [user.member_id, event.id], function(error, rows) {
               if (rows[0] == null){
                    sql.query("INSERT INTO Signup SET event_id=?, member_id=?, points=?", 
                    [event.id, user.member_id, event.extendedProperties.shared.points],
                    function(error){
                        if(error) {
                            callback(error);
                        } else {
                            //Increases points amount in user table.
                            sql.query("UPDATE Member SET points=? WHERE member_id=?",
                            [parseInt(user.points) + parseInt(event.extendedProperties.shared.points), user.member_id],
                            function(error){
                                if (error){
                                    callback(error);
                                } else {
                                    callback(false);
                                }
                            });
                        }
                    });
                } else { //Even though user already signed up, return to their profile page.
                    callback(false);
                } 
            });
        }
    });
};

//Creates a post, and then updates the dates and OPs for the thread and topics.
exports.postComment = function(comment, callback) {
    //Comment object should be sturctured as (thread_id, member_id, comment, datetime).
    //Comments are HTML, so this (should) strip out any scripts in a post to prevent XSS attacks.
    var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    while (SCRIPT_REGEX.test(comment.comment)) {
        comment.comment = comment.comment.replace(SCRIPT_REGEX, "");
    }
    //Creates the post.
    sql.query("INSERT INTO Comment SET ?", comment, function(error, rows) {
        if (error){
            callback(error);
        } else {
            updatePostCount(comment.member_id, function(error){
                if (error){
                    callback(error);
                } else {
                    updateLastThreadPost(comment.thread_id, [rows.insertId] , callback);
                }
            });
        }
    });
};

exports.getUserById = function(id, callback) {
    sql.query("SELECT * FROM Member WHERE member_id=?", [id], function(error, rows) {
        if (error) {
            callback(error, null);
            return false;
        }
        else {
            if (rows[0] === undefined) {
                callback(false, null);
                return false;
            }
            else {
                callback(false, rows[0]);
                return true;
            }
        }
    });
};

//Creates a new topic (and category, if needed).
exports.createTopic = function(topic, callback) {
    //checks to see if category exists
    sql.query("SELECT forum_id FROM Forum WHERE forum_name=?", [topic.category], function(error, rows, fields) {
        if (rows[0] === undefined) {
            //create new category
            sql.query('INSERT INTO Forum (forum_name) VALUES (?); ', [topic.category], function(error, rows) {
                //Gets id of newly created category
                sql.query("SELECT forum_id FROM Forum WHERE forum_name=?", [topic.category], function(error, rows, fields) {
                    //Creates topic
                    sql.query('INSERT INTO Topic (forum_id, topic_name, topic_description) VALUES (?, ?, ?)', [rows[0].forum_id,
                        topic.title,
                        topic.description
                    ], function(error, rows, fields) {
                        if (error) {
                            callback(error);
                        }
                        else {
                            callback(false);
                        }
                    });
                });
            });
        }
        else { //If category already exists, just create a new topic.
            console.log(rows[0]);
            sql.query('INSERT INTO Topic (forum_id, topic_name, topic_description) VALUES (?, ?, ?)', [rows[0].forum_id,
                    topic.title,
                    topic.description
            ],
            function(error, rows, fields) {
                if (error) {
                    callback(error);
                }
                else {
                    callback(false);
                }
            });
        }
    });
};

exports.getUserByName = function(fname, lname, callback) {
    sql.query("SELECT * FROM Member WHERE fname=? AND lname=?", [fname, lname], function(error, rows) {
        if (error) {
            callback(error, null);
            return false;
        } else {
            callback(false, rows[0]);
            return true;
        }
    });
};

//Returns a topic objet with a given name.
exports.getTopicByName = function(name, callback){
    sql.query("SELECT * FROM Topic WHERE topic_name=?", [name], function(error, rows) {
        if (error) {
            callback(error);
        } else if (rows[0] == null){
            callback(false, undefined);
        } else {
            callback(false, rows[0]);
        }
    });
};

//Returns latest updated posts for a given forum topic.
exports.getTopicPosts = function(topic_id, numresults, callback){
    sql.query("SELECT op.fname AS opfname, op.lname AS oplname, lastpost.*, lastuser.fname, lastuser.lname, Thread.thread_name, Thread.datetime AS opdatetime, Thread.post_count FROM Thread " + 
            "INNER JOIN Member AS op ON op.member_id=Thread.thread_op_id " +
            "INNER JOIN Comment AS lastpost ON lastpost.comment_id=Thread.last_post_id " +
            "INNER JOIN Member AS lastuser ON lastuser.member_id = lastpost.member_id " +
            "WHERE topic_id=? ORDER BY lastpost.datetime DESC LIMIT ?", 
            [topic_id, numresults], function(error, rows) {
                if (error){
                    callback(error);
                } else {
                    callback(false, rows);
                }
            });
};

//Gets a certain number of comments from a thread.
exports.getThreadComments = function(thread_id, numresults, callback){
    sql.query("SELECT * FROM Comment " +
        "INNER JOIN Member ON Comment.member_id = Member.member_id " +
        "WHERE thread_id=? ORDER BY datetime ASC LIMIT ?",
        [thread_id, numresults],
        function(error, rows) {
           if (error){
                callback(error);
            } else {
                callback(false, rows);
            }
        });
};

//Creates a new thread and returns it.
//Params: topic id, thread name, thread OP's member ID, callback
exports.createThread = function(topic_id, title, op_member_id, callback){
     sql.query("INSERT INTO Thread (thread_name, topic_id, thread_op_id, datetime) VALUES (?, ?, ?, ?)",
                [title, 
                topic_id,
                op_member_id,
                (new Date())
            ], function (error, rows){
                if (error) {
                    callback(error);
                } else {
                    //Gets the thread.
                    sql.query("SELECT * FROM Thread WHERE thread_id=?", [rows.insertId], function(error, rows){
                        if (error){
                            callback(error);
                        } else {
                            callback(false, rows[0]);
                        }
                    });
                }
            });
};

//Updates a user id based on supplied fields in edits.
exports.updateUser = function(id, edits, callback) {
    sql.query("UPDATE Member INNER JOIN Credential ON Credential.member_id=Member.member_id SET ? WHERE Member.member_id=?",
    [edits, id],
    function(error) {
        if (error) {
            callback(error);   
        } else {
            callback(false);
        }
    });
};


//Gets all the topics in a category.
exports.getCategoryTopics = function(category_id, callback){
    sql.query("SELECT * FROM Topic WHERE forum_id=?", category_id, function(error, rows){
       if (error) {
            callback(error);   
        } else {
            callback(false, rows);
        }
    });
};

//Gets user by email.
exports.getUserByEmail = function(email, callback){
    sql.query("SELECT * FROM Member WHERE Email=?", [email], function(error, rows) {
        if (error) {
            callback(error);   
        } else {
            callback(false, rows[0]);
        }
    });
};

//Gets user by facebook id.  Only current use is for facbook logins.
exports.getUserByFacebookId = function(fb_id, callback){
    sql.query("SELECT * FROM Member WHERE facebook_id=?", [fb_id], function(error, rows) {
        if (error) {
            callback(error);   
        } else {
            callback(false, rows[0]);
        }
    });
};

exports.getPasswordHash = function(member_id, callback){
    sql.query("SELECT * FROM Credential WHERE member_id=?", [member_id], function(error, rows){
        if (error) {
            callback(error);
        } else {
            callback(false, rows[0].password);
        }
    });
};

//Gets all the categories.
exports.getCategories = function(callback){
    sql.query("SELECT * FROM Forum", function(error, rows){
       if (error) {
            callback(error);   
        } else {
            callback(false, rows);
        }
    });
};

//Creates a new user, and returns the user object created to a callback.
//Params: user object with fname, mi, lname, email, password, major, class, grad_date, tshirt_size
//Callback with params error and user
exports.addNewUser = function(user, password, callback) {
    if (config.sql.enabled) {
        //Checks to see if we already have a user with the entered email
        sql.query("SELECT email FROM Member WHERE email=?", [user.email], function(error, rows, fields) {
            if (error) {
                callback(error);
            } else if (rows[0] !== undefined) {
                //res.send("ERROR : Email already exists in database!");
                callback("Email already exists in database!");
            }
            else {
                sql.query("INSERT INTO Member SET ?", [user], function(error, rows) {
                    if (error){
                        callback(error);
                        return
                    }
                    //Gets ID of newly created user.
                    sql.query("SELECT * FROM Member WHERE member_id=?", [rows.insertId], function(error, urows) {
                        //Adds password to credidentials table.
                        sql.query("INSERT INTO Credential SET ?", [{member_id: urows[0].member_id, password:password}], function(error, rows) {
                            if (error){
                                callback(error);
                            }
                            callback(false, urows[0]);  
                        });
                    });
                });
            }
        });
    }
    else {
        //Throw the error page if SQL server disabled.
        callback("SQL Disabled!");
    }
};

function updateLastTopicThread(topicid, threadid, callback) {
    sql.query("UPDATE Topic SET last_thread_id=?, post_count = post_count + 1 WHERE topic_id=?", [threadid, topicid], function(error) {
        if (error){
            callback(error);
        } else {
            callback(false);
        }
    });
}

function updateLastThreadPost(threadid, last_post_id, callback) {
    sql.query("UPDATE Thread SET last_post_id=?, post_count = post_count + 1 WHERE thread_id=?", [last_post_id, threadid], function(error) {
        if (error){
            callback(error);
        } else {
            sql.query("SELECT topic_id FROM Thread WHERE thread_id=?", [threadid], function(error, rows) {
                if (error){
                    callback(error);
                } else {
                    updateLastTopicThread(rows[0].topic_id, threadid, callback);
                }
            });
        }
    });
}

function updatePostCount(member_id, callback){
    sql.query('UPDATE Member SET post_count = post_count + 1 WHERE member_id=?', [member_id], function(error) {
        callback(error);
    });
}
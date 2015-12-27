//Various MySQL databse helpers.
var mysql = require('../node_modules/mysql');
var config = require('../config');

if (config.sql.enabled) {
    var sql = mysql.createConnection({
        host: process.env.CLEARDB_DATABASE_URL || config.sql.host,
        user: process.env.CLEARDB_DATABASE_USER || config.sql.user,
        password: process.env.CLEARDB_DATABASE_PASSWORD || config.sql.password || "",
        database: config.sql.dbname
    });
    sql.connect();
}
else {
    console.warn("SQL server disabled in config.js.  Signup and login functionality disabled.");
}

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
    //Comment object should be sturctured as (thread_id, member_id, comment).
    //TODO: Add dates into the table?
    //Creates the post.
    sql.query("INSERT INTO Comment SET ?", comment, function(error, rows) {
        if (error){
            callback(error);
        } else {
            sql.query("SELECT LAST_INSERT_ID()", function(error, rows){
                updatePostCount(comment.member_id, function(error){
                    if (error){
                        callback(error);
                    } else {
                        updateLastThreadPost(comment.thread_id, rows[0]["LAST_INSERT_ID()"] , callback);
                    }
                });
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

exports.updateUser = function(user, callback) {

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
            }
            if (rows[0] !== undefined) {
                //res.send("ERROR : Email already exists in database!");
                callback("Email already exists in database!");
            }
            else {
                sql.query("INSERT INTO Member SET ?", [user], function(error, rows) {
                    //Gets ID of newly created user.
                    sql.query("SELECT * FROM Member WHERE email=?", [user.email], function(error, urows) {
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
        callback(error);
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
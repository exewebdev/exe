//Various MySQL databse helpers.
var mysql = require('../node_modules/mysql');
var config = require('../config');

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

//Creates a post, and then updates the dates and OPs for the thread and topics.
exports.postComment = function(comment, onsuccess, onfail, onerror) {
    //Comment object should be sturctured as (thread_id, member_id, comment).
    //TODO: Add dates into the table?
    //Creates the post.
    sql.query("INSERT INTO Comment SET ?", comment, function(error, rows) {
        if (error){
            console.log(error);
            onerror(error);
        } else {
            sql.query("SELECT LAST_INSERT_ID()", function(error, rows){
                 console.log(rows);
                updatePostCount(comment.member_id, function(error){
                    if (error){
                        onfail();
                    } else {
                        updateLastThreadPost(comment.thread_id, rows[0]["LAST_INSERT_ID()"] , onsuccess);
                    }
                });
            });
        }
    });
};

exports.getUserById = function(id, onsuccess, onfail, onerror) {
    sql.query("SELECT * FROM Member WHERE member_id=?", [id], function(error, rows) {
        if (error) {
            onerror(error);
            return false;
        }
        else {
            if (rows[0] === undefined) {
                onfail();
                return false;
            }
            else {
                onsuccess(rows[0]);
                return true;
            }
        }
    });
};

exports.createTopic = function(topic, onsuccess, onfail, onerror) {
    //checks to see if category exists
    sql.query("SELECT forum_id FROM Forum WHERE forum_name=?", [topic.category], function(error, rows, fields) {
        if (rows[0] === undefined) {
            //create new category
            sql.query('INSERT INTO Forum (forum_name) VALUES (?); ', [topic.category], function(error, rows) {
                //
                sql.query("SELECT forum_id FROM Forum WHERE forum_name=?", [topic.category], function(error, rows, fields) {
                    sql.query('INSERT INTO Topic (forum_id, topic_name, topic_description) VALUES (?, ?, ?)', [rows[0].forum_id,
                        topic.title,
                        topic.description
                    ], function(error, rows, fields) {
                        if (error) {
                            onerror();
                        }
                        else {
                            onsuccess();
                        }
                    });
                });
            });
        }
        else {
            console.log(rows[0]);
            sql.query('INSERT INTO Topic (forum_id, topic_name, topic_description) VALUES (?, ?, ?)', [rows[0].forum_id,
                    topic.title,
                    topic.description
            ],
            function(error, rows, fields) {
                if (error) {
                    onerror();
                }
                else {
                    onsuccess();
                }
            });
        }
    });
};

exports.getUserByName = function(fname, lname, onsuccess, onfail, onerror) {
    sql.query("SELECT * FROM Member WHERE fname=? AND lname=?", [fname, lname], function(error, rows) {
        if (error) {
            onerror(error);
            return false;
        }
        else {
            if (rows[0] === undefined) {
                onfail();
                return false;
            }
            else {
                onsuccess(rows[0]);
                return true;
            }
        }
    });
};

exports.updateUser = function(user, onsuccess, onfail) {

};

//Creates a new user, and returns the user object created to a callback.
//Params: user object with fname, mi, lname, email, password, major, class, grad_date, tshirt_size
//Callbacks for successful add, failed add, or db error.
exports.addNewUser = function(user, password, onsuccess, onfail, onerror) {
    if (config.sql.enabled) {
        //Checks to see if we already have a user with the entered email
        sql.query("SELECT email FROM Member WHERE email=?", [user.email], function(error, rows, fields) {
            if (error) {
                onerror();
            }
            if (rows[0] !== undefined) {
                //res.send("ERROR : Email already exists in database!");
                onfail();
            }
            else {
                sql.query("INSERT INTO Member SET ?", [user], function(error, rows) {
                    //Gets ID of newly created user.
                    sql.query("SELECT * FROM Member WHERE email=?", [user.email], function(error, urows) {
                        //Adds password to credidentials table.
                        sql.query("INSERT INTO Credential SET ?", [{member_id: urows[0].member_id, password:password}], function(error, rows) {
                            if (error){
                                console.log(error);
                            }
                            onsuccess(urows[0]);  
                        });
                    });
                });
            }
        });
    }
    else {
        //Throw the error page if SQL server disabled.
        onerror();
    }
};

function updateLastTopicThread(topicid, threadid, callback) {
    sql.query("UPDATE Topic SET last_thread_id=?, post_count = post_count + 1 WHERE topic_id=?", [threadid, topicid], function(error) {
        if (error){
            callback(error);
        } else {
            callback();
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
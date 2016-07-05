//Various MySQL databse helpers.
var Sequelize = require('../node_modules/sequelize');
var config = require('../config');

if (config.sql.enabled) {
    if (process.env.CLEARDB_DATABASE_URL){ //for heroku's cleardb-
        var sequelize = new Sequelize(process.env.CLEARDB_DATABASE_URL, {
                host: process.env.DATABASE_HOST || config.sql.host,
                dialect: 'mysql',
                pool: {
                    max: 5,
                    min: 0,
                    idle: 10000
                },
        });
    } else {
        var sequelize = new Sequelize(
            process.env.DATABASE_NAME || config.sql.dbname,
            process.env.DATABASE_USER || config.sql.user,
            process.env.DATABASE_PASSWORD || config.sql.password || "", {
                host: process.env.DATABASE_HOST || config.sql.host,
                dialect: 'mysql',
                pool: {
                    max: 5,
                    min: 0,
                    idle: 10000
                },
        });
    }
}
else {
    console.warn("SQL server disabled in config.js.  Signup and login functionality disabled.");
}

//Sequelize database models.
var Comment = sequelize.import("../models/Comment");
var Credential = sequelize.import("../models/Credential");
var Event = sequelize.import("../models/Event");
var Forum = sequelize.import("../models/Forum");
var MailingList = sequelize.import("../models/MailingList");
var Member = sequelize.import("../models/Member");
var Member_has_Event = sequelize.import("../models/Member_has_Event");
var Thread = sequelize.import("../models/Thread");
var Topic = sequelize.import("../models/Topic");

//Sequelize relationships.
// Topic.belongsTo(Forum);
// Thread.belongsTo(Topic);
Thread.belongsTo(Member, {as: "op", foreignKey: 'thread_op_id'});
//Comment.belongsTo(Thread, {foreignKey: 'thread_id'});
Comment.belongsTo(Member, {foreignKey: 'member_id'});
Forum.hasMany(Topic, {foreignKey: 'forum_id'});
Topic.hasMany(Thread, {foreignKey: 'topic_id'});
Thread.hasMany(Comment, {foreignKey: 'thread_id'});
Member.belongsToMany(Event, {through: Member_has_Event});
Member.hasOne(Credential, {foriegnKey: 'member_id'});
sequelize.sync();

//Adds an event to the calendar db, and returns the ID of the created event to a callback.
exports.addEvent = function(name, password, id, callback){
    event = {
        event_name : name,
        event_password : password,
        event_id: id
    };
    Event.create(event).then(function(event) {
        callback(null, event);
    });
};

//"Checks-in" a user, i.e gives the user points based on the point valeu of the specified event.
//Params: user to add point, event form google calendar, callbackk
exports.checkInUser = function(user, event, callback){
    Member.findOne({where:{fname: user.fname, lname: user.lname}}).then(function(member){
        //Check to see if member already checked in.
        Member.hasEvent(event.id).then(function(hasEvent){
            if (hasEvent){
                callback(false);
            } 
            else {
                Member.addEvent(event.id).then(function(row){
                    callback(member);
                });
            }
        });
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
    Comment.create(comment).then(function(comment){
        callback(false, comment);
    }, callback);
};

exports.getUserById = function(id, callback) {
    Member.findOne({where: {member_id:id}}).then(function(member){
        callback(false, member.dataValues);
    }, callback);
};

//Creates a new topic (and category, if needed).
exports.createTopic = function(topic, callback) {
    //checks to see if category exists, make one if not
    Forum.findOrCreate({
        where: {forum_name: topic.category},
        defaults: {forum_name:topic.category}
    }).spread(function(forum, created){
        Topic.create({topic_name: topic.title, topic_description: topic.description}).then(function(topic){
            forum.addTopic(topic);
            forum.save().then(function(){
                callback(false);
            });
        });
    });
};

exports.getUserByName = function(fname, lname, callback) {
    Member.findOne({where: {fname:fname, lname: lname}}).then(function(member){
        callback(false, member.dataValues);
    }, callback);
};

//Returns a topic objet with a given name.
exports.getTopicByName = function(name, callback){
    Topic.findOne({
        where:{topic_name: name},
        //nested loads ftw
        include:[
            {model:Thread, include:[
                {model:Comment, include:[Member]},
                {model:Member, as:'op'}
            ]},
        ],
        order:[[Thread, Comment, 'datetime', 'DESC']]
    }).then(function(topic){callback(false, topic.dataValues)});
};

//Gets a thread based on a JSON query.
exports.getThread = function(thread, callback){
    //Includes nested so as to load the member's data values
    Thread.findOne({where: thread, include:[{model:Comment, include:[Member]}]}).then(function(thread){
        callback(false, thread.dataValues);
    }, callback);
};

//Gets all users, sorted by last name.
exports.getAllUsers = function(callback){
    Member.findAll().then(function(member){
        callback(false, member.dataValues);
    }, callback);
};

//Creates a new thread with original post and returns it.
//Params: topic id, thread name, thread OP's member ID, original post, callback
exports.createThread = function(topic_id, title, op_member_id, first_post, callback){
    var newThread = 
    {
        thread_name: title,
        topic_id: topic_id,
        thread_op_id: op_member_id,
        Comments: [first_post]
    };
    Thread.create(newThread,{include: [Comment]}).then(function(forum){
        callback(false, forum);
    });
};

//Updates a user id based on supplied fields in edits.
exports.updateUser = function(id, edits, callback) {
    Member.update(edits,{where: {member_id: id}}).then(function(member){
        callback(false);
    }, function(err){
        callback(err);
    });
};


//Gets user by email.
exports.getUserByEmail = function(email, callback){
    Member.findOne({where:{email: email}}).then(function(member){
        callback(false, member);
    });
};

//Gets user by facebook id.  Only current use is for facbook logins.
exports.getUserByFacebookId = function(fb_id, callback){
    Member.findOne({where:{facebook_id: fb_id}}).then(function(member){
        callback(false, member);
    });
};

exports.getPasswordHash = function(member_id, callback){
    Credential.findOne({where: {member_id: member_id}}).then(function(row){
       callback(false, row.dataValues); 
    });
};

//Gets all the categories and topics.
exports.getCategories = function(callback){
    Forum.findAll({include: [Topic]}).then(function(forum){
        callback(forum);
    });
};

//Creates a new user, and returns the user object created to a callback.
//Params: user object with fname, mi, lname, email, password, major, class, grad_date, tshirt_size
//Callback with params error and user
exports.addNewUser = function(user, password, callback) {
    user.credential.password = password;
    Member.findOrCreate({
        where:{email: user.email},
        defaults: user,
    }, {include: [Credential]}).spread(function(member, isCreated){
        if (isCreated){
            callback("Email already exists in database!");
        } else {
            callback(false, member.dataValues);
        }
    });
};
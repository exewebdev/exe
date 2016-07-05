var Sequelize = require('../node_modules/sequelize');
var config = require('../config');
var express = require('../node_modules/express');
var router = express.Router();

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
var Club = sequelize.import("../models/Club.js");
var Comment = sequelize.import("../models/Comment.js");
var Credential = sequelize.import("../models/Credential.js");
var Donation = sequelize.import("../models/Donation.js");
var Donor = sequelize.import("../models/Donor.js");
var Event = sequelize.import("../models/Event.js");
var Forum = sequelize.import("../models/Forum.js");
var MailingList = sequelize.import("../models/MailingList.js");
var Member = sequelize.import("../models/Member.js");
var Member_has_Event = sequelize.import("../models/Member_has_Event.js");
var News = sequelize.import("../models/News.js");
var Officer = sequelize.import("../models/Officer.js");
var ProjectGroup = sequelize.import("../models/ProjectGroup.js");
var ProjectGroup_has_Member = sequelize.import("../models/ProjectGroup_has_Member.js");
var Thread = sequelize.import("../models/Thread.js");
var Topic = sequelize.import("../models/Topic.js");

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

router.get("/Comment", function(req, res){
    Comment.findAll({where: req.query}).then(function(results){
        res.send(results);
    })
});
router.get("/Comment/:id", function(req, res){
    Comment.findOne({where: {comment_id: req.params.id}}).then(function(result){
        res.send(result);
    })
});
router.post("/Comment", function(req, res){
  Topic.create(req.body).then(function(newval){
    res.send(newval);
  });
});
router.put("/Comment/:id", function(req, res){
  Comment.upsert(req.body).then(function(row){
    res.send(result);
  }, function(err){
    res.send(err)
  });
});
router.get("/Event", function(req, res){
    Event.findAll({where: req.query}).then(function(results){
        res.send(results);
    })
});
router.get("/Event/:id", function(req, res){
    Event.findOne({where: {event_id: req.params.id}}).then(function(result){
        res.send(result);
    })
});
router.post("/Event", function(req, res){
  Topic.create(req.body).then(function(newval){
    res.send(newval);
  });
});
router.put("/Event/:id", function(req, res){
  Event.upsert(req.body).then(function(row){
    res.send(result);
  }, function(err){
    res.send(err)
  });
});
router.get("/Forum", function(req, res){
    Forum.findAll({where: req.query}).then(function(results){
        res.send(results);
    })
});
router.get("/Forum/:id", function(req, res){
    Forum.findOne({where: {forum_id: req.params.id}}).then(function(result){
        res.send(result);
    })
});
router.post("/Forum", function(req, res){
  Topic.create(req.body).then(function(newval){
    res.send(newval);
  });
});
router.put("/Forum/:id", function(req, res){
  Forum.upsert(req.body).then(function(row){
    res.send(result);
  }, function(err){
    res.send(err)
  });
});
router.get("/Member", function(req, res){
    Member.findAll({where: req.query}).then(function(results){
        res.send(results);
    })
});
router.get("/Member/:id", function(req, res){
    Member.findOne({where: {member_id: req.params.id}}).then(function(result){
        res.send(result);
    })
});
router.post("/Member", function(req, res){
  Topic.create(req.body).then(function(newval){
    res.send(newval);
  });
});
router.put("/Member/:id", function(req, res){
  Member.upsert(req.body).then(function(row){
    res.send(result);
  }, function(err){
    res.send(err)
  });
});
router.get("/ProjectGroup", function(req, res){
    ProjectGroup.findAll({where: req.query}).then(function(results){
        res.send(results);
    })
});
router.get("/ProjectGroup/:id", function(req, res){
    ProjectGroup.findOne({where: {proj_group_id: req.params.id}}).then(function(result){
        res.send(result);
    })
});
router.post("/ProjectGroup", function(req, res){
  Topic.create(req.body).then(function(newval){
    res.send(newval);
  });
});
router.put("/ProjectGroup/:id", function(req, res){
  ProjectGroup.upsert(req.body).then(function(row){
    res.send(result);
  }, function(err){
    res.send(err)
  });
});
router.get("/Thread", function(req, res){
    Thread.findAll({where: req.query}).then(function(results){
        res.send(results);
    })
});
router.get("/Thread/:id", function(req, res){
    Thread.findOne({where: {thread_id: req.params.id}}).then(function(result){
        res.send(result);
    })
});
router.post("/Thread", function(req, res){
  Topic.create(req.body).then(function(newval){
    res.send(newval);
  });
});
router.put("/Thread/:id", function(req, res){
  Thread.upsert(req.body).then(function(row){
    res.send(result);
  }, function(err){
    res.send(err)
  });
});
router.get("/Topic", function(req, res){
    Topic.findAll({where: req.query}).then(function(results){
        res.send(results);
    })
});
router.get("/Topic/:id", function(req, res){
    Topic.findOne({where: {topic_id: req.params.id}}).then(function(result){
        res.send(result);
    })
});
router.post("/Topic", function(req, res){
  Topic.create(req.body).then(function(newval){
    res.send(newval);
  });
});
router.put("/Topic/:id", function(req, res){
  Topic.upsert(req.body).then(function(row){
    res.send(result);
  }, function(err){
    res.send(err)
  });
});

module.exports = router;
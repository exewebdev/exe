// Database test suite for dbhelper.js.
var expect = require("chai").expect;
process.env.TEST = 'true';
var db = require("../lib/dbhelper.js");

describe("Database Functions", function(){
    //Rebuild the database schema before every test.
    beforeEach(function(done){
        db.forceSync(function(){
            done();
        })
    })
    
    describe("Add Event", function(){
        it("creates the event", function(done){
            db.addEvent("Party", "foo", "1", function(error, event){
                console.log(event)
                expect(event.dataValues.event_id).to.equal("1");
                done();
            })
        })
    })
    
    describe("Check in user", function() {
        beforeEach(function(done){
            //create user
            db.addNewUser(
                {fname:"Foo", lname:"Manchu",email:"foomanchu@example.net"},
                "somesupersecretpassword",
                function(error, member){ 
                    //create an event
                    db.addEvent("Party", "foo", "1", function(id){
                        done()
                    })
                }
            )
        })
        it("gives users points for checking in", function(done){
            db.checkInUser({fname: "Foo", lname: "Manchu"}, "1", function(member){
                member.hasEvent({'event_id':"1"}).then(function(hasEvent){
                    expect(hasEvent).to.be.true()
                    //expect(member.dataValues.points).to.not.equal(0)
                    done()
                })
            })
        })
        it("doesn't allow members to check in more then once", function(done){
            db.checkInUser({fname: "Foo", lname: "Manchu"}, "1", function(member){
                expect(member.hasEvent("1")).to.be.true
                //attempt a second check in
                db.checkInUser({fname: "Foo", lname: "Manchu"}, "1", function(member){
                    expect(member).to.be.false
                    done()
                })
            })
        })
    })
    describe("Forums", function(){
        describe("Topic Creation", function(){
            it("should make topics", function(done){
                var newTopic = {
                    title: "New Topic",
                    description: "Test Description",
                    category: "New Category"
                }
                db.createTopic(newTopic, function(err){
                    expect(err).to.be.false
                    db.getTopicByName("New Topic", function(err, topic){
                        expect(topic.topic_name).to.equal("New Topic")
                        expect(err).to.be.false
                        done()
                    })
                })
            })
            it("should make categories if none exist", function(done){
                var newTopic = {
                    title: "New Topic",
                    description: "Test Description",
                    category: "New Category"
                }
                db.createTopic(newTopic, function(err){
                    expect(err).to.be.false
                    db.getCategories(function(categories){
                        expect(categories[0].dataValues.forum_name).to.equal("New Category")
                        expect(err).to.be.false
                        done()
                    })
                })
            })
        })
        describe("Threads", function(){
            it("should create threads", function(){
                
            })
        })
    })
    describe("User Tasks", function(){
        describe("Retrieval", function() {
            beforeEach(function(done) {
                var user = {
                    fname:"Foo",
                    mi:"A",
                    lname:"Bar",
                    email:"foobar@example.com",
                    major:"cs",
                    'class':"freshman",
                    tshirt_size:"xl",
                    facebook_id:"123",
                    facebook_token:"456"
                }
                db.addNewUser(user, "it's secret!@#@222", function(){
                    done();
                })
            })
            it("should get a user by ID", function(done){
                db.getUserById(1, function(err, user){
                    expect(user.fname).to.equal("Foo")
                    done()
                })
            })
            it("should get a user by first and last name", function(done){
                db.getUserByName("Foo", "Bar", function(err, user){
                    expect(user.email).to.equal("foobar@example.com")
                    done()
                })
            })
            it("should get a user by email", function(done){
                db.getUserByEmail("foobar@example.com", function(err, user){
                    expect(user.fname).to.equal("Foo")
                    done()
                })
            })
            it("should get a user by facebook id", function(done){
                db.getUserByFacebookId("123", function(err, user){
                    expect(user.fname).to.equal("Foo")
                    done()
                })
            })
            it("should get a password hash for a user", function(done){
                db.getPasswordHash(1, function(err, hash){
                   //we actually didn't hash the password, that's done in app.js
                   expect(hash.password).to.equal("it's secret!@#@222")
                   done()
                })
            })
        })
    })
})
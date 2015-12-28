var google = require("../node_modules/googleapis");
var googleAuth = require('../node_modules/google-auth-library');
var fs = require("fs");
var calendarId  = process.env.GOOGLE_CALENDAR_ID || "someuser@gmail.com"; //Using my primary calendar as a default
// Load client secrets from a local file.
fs.readFile('google-svc-auth.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading Google client secret file!');
        authorize({
            client_email : process.env.GOOGLE_CLIENT_EMAIL,
            private_key : process.env.GOOGLE_CLIENT_PK
        });
        return;
    }
    authorize(JSON.parse(content));
});

var authorize = function(credentials) {
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2();
    var jwt = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/calendar']);	
    jwt.authorize(function(err, result) {
        oauth2Client.setCredentials({
            access_token: result.access_token
        });
        google.options({ auth: oauth2Client });
    });
};


//Adds an event to the calendar and stores it in the database.
//Parameters: Event Name, Event Date, Event Start Time, Event End Time, Event Location, Event Description, Event Point Value, Event Password
exports.addEvent = function (name, startdatetime, enddatetime, location, description, points, password, callback){
    var calendar = google.calendar('v3');
    var event = {
        'summary' : name,
        'location' : location,
        'description' : description,
        'start' : {
            'dateTime' : startdatetime
        }, 
        'end' : {
            'dateTime' : enddatetime
        },
        'extendedProperties' : {
            'private' : {
                'password' : password
            },
            'shared' : {
                'points' : points
            }
        }
    };
    console.log(event);
    calendar.events.insert({
        calendarId: calendarId,
        resource: event
    }, function(err, event){
       if (err){
           callback(err);
           return;
       } 
       console.log('Event created: %s', event.htmlLink);
       callback();
    });
};

//Queries the Google calendar for an event that is happening curently, and returns it to a callaback.  Returns an error if no event found.
exports.getCurrentEvent = function(callback){
    var calendar = google.calendar('v3');
    calendar.events.list({
        calendarId: calendarId,
        timeMin: (new Date()).toISOString(),
        //timeMax: (new Date()).toISOString(),
        maxResults: 1,
        singleEvents: true,
        orderBy: 'startTime'
  }, function(err, response) {
        if (err) {
            callback(err, null);
            return false;
        } else { 
            var events = response.items;
            if (events.length == 0){
                callback("No current event found.", null);
            } else {
                callback(false, events[0]);
            }
        }
    });
};

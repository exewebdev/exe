var google = require("../node_modules/googleapis");
var googleAuth = require('../node_modules/google-auth-library');
var fs = require("fs");

// Load client secrets from a local file.
fs.readFile('google-svc-auth.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading Google client secret file, calendar API disabled.');
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
        calendarId: 'pokemonmegman@gmail.com',
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

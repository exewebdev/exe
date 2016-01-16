var mailchimpapi = require("../node_modules/mailchimp-api");
var config = require('../config');

var mc = new mailchimpapi.Mailchimp(process.env.MAILCHIMP_API || config.mailchimp.apikey || "");
var list = process.env.MAILCHIMP_LIST || config.mailchimp.list || "";

//Subscribes a user to the default mailing list.
exports.subscribeUser = function(user, callback){
    //subscribe(string apikey, string id, struct email, struct merge_vars, string email_type, bool double_optin, bool update_existing, bool replace_interests, bool send_welcome)
    mc.lists.subscribe({
        id: list, 
        email: {email: user.email}, 
        merge_vars: {FNAME: user.fname, LNAME: user.lname},
        double_optin: false,
        send_welcome: true
    });
};

//Unsubscribes a user from the default mailing list.
exports.unsubscribeUser = function(user, callback){
    mc.lists.unsubscribe({
        id: list,
        email: {email: user.email},
        send_goodbye : false
    });
};
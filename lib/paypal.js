var paypal = require('../node_modules/paypal-rest-sdk');
var config = require('../config');

paypal.configure({
  'mode' : process.env.PAYPAL_MODE || config.paypal.mode || 'sandbox', //sandbox or live
  'client_id' : process.env.PAYPAL_ID || config.paypal.client_id || '',
  'client_secret' : process.env.PAYPAL_SECRET || config.paypal.client_secret || ''
});


//Pays dues for a given member.
//Member object should have fname, lname, and email, or be a member object from the database.
exports.payDues = function(member, callback){
    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://" + (process.env.FQDN || config.fqdn) + "/pay/return",
            "cancel_url": "http://" + (process.env.FQDN || config.fqdn) + "/pay/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "EXE Membership Dues",
                    "price": "25.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "25.00"
            },
            "description": "Payment for EXE Membership Dues (good for 1 year)"
        }]
    };
    paypal.payment.create(create_payment_json, callback);
};

exports.executePayment = function(payerId, paymentId, callback){
    var details = { "payer_id" : payerId };
    paypal.payment.execute(paymentId, details, callback);
};
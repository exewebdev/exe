var config = require ('../config');
var stripe = require ('../node_modules/stripe')(process.env.STRIPE_SECRET || config.stripe.secret || "sk_test_3pGKeJIsjhfcEUVAXinrNkVX");

exports.executePayment = function(token, callback){
    stripe.charges.create({
      amount: 2500,
      currency: "usd",
      source: token,
      description: "EXE Membership Dues"
    }, function(err, charge) {
      if (err) {
        console.error(err);
        callback(err);
      } else {
        callback();
      }
    });
};
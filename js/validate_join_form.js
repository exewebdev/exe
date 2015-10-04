// Form validation for join.html

var reEmail = /^[a-z0-9.+_%-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;   // form email validation
var reName = /^[a-zA-Z]+$/;                                // form name validation

// Always run when submit occurs
// Won't be run on Chrome, Safari, Opera or Firefox until the data is actually valid
function CheckForm() {
    var retValue = true;

    // DOM nodes
    var form = {
        join:           document.getElementById("join"),
        fname:          document.getElementById("fname"),
        initial:        document.getElementById("initial"),
        lname:          document.getElementById("lname"),
        email:          document.getElementById("email"),
        major:          document.getElementById("major"),
        classification: document.getElementById("classification"),
        grad_date:      document.getElementById("grad_date"),
        tshirt:         document.getElementById("tshirt")
    };

    var msg = "";

    if  (!reName.test(form.fname.value))   // check first name
        msg += "\nyour first name";
    if  (!reName.test(form.lname.value))   // check last name
        msg += "\nyour last name";
    if  (!reEmail.test(form.email.value))   // check email
        msg += "\nyour email address";

    // complete message
    if (msg != "") {
        msg = "Please check:"+msg;
    }
    else {
        msg = "Form is valid!\nSubmitting...";
    }

    alert(msg);
}

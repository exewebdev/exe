// Form validation for join.html

var reEmail = /^[a-z0-9.+_%-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;   // form email validation
var reName = /^[a-zA-Z]+[a-zA-Z]$/;                                // form name validation

// Always run when submit occurs
// Won't be run on Chrome, Safari, Opera or Firefox until the data is actually valid
function CheckForm() {

    // DOM nodes
    var form = {
        join:           document.getElementById("join"),
        fname:          document.getElementById("fname"),
        initial:        document.getElementById("initial"),
        lname:          document.getElementById("lname"),
        email:          document.getElementById("email"),
        major:          document.getElementById("major"),
        class:          document.getElementById("classification"),
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
    if (msg != "")
        msg = "Please check:"+msg;
    else
        msg = "Form is valid!\nSubmitting...";

    alert(msg);
}

function initStorage(){
    // DOM nodes
    var form = {
        fname:          document.getElementById("fname"),
        mi:             document.getElementById("initial"),
        lname:          document.getElementById("lname"),
        email:          document.getElementById("email"),
        major:          document.getElementById("major"),
        classification: document.getElementById("classification"),
        grad_date:      document.getElementById("grad_date"),
        tshirt:         document.getElementById("tshirt")
    };

    sessionStorage.setItem("fname", form.fname.value);
    sessionStorage.setItem("mi", form.mi.value);
    sessionStorage.setItem("lname", form.lname.value);
    sessionStorage.setItem("email", form.email.value);
    sessionStorage.setItem("major", form.major.value);
    sessionStorage.setItem("classification", form.classification.value);
    sessionStorage.setItem("grad_date", form.grad_date.value);
    sessionStorage.setItem("tshirt", form.tshirt.value);
}

function loadStorage(){

    // DOM nodes
    var form = {
        fname:          document.getElementById("fname"),
        mi:             document.getElementById("initial"),
        lname:          document.getElementById("lname"),
        email:          document.getElementById("email"),
        major:          document.getElementById("major"),
        classification: document.getElementById("classification"),
        grad_date:      document.getElementById("grad_date"),
        tshirt:         document.getElementById("tshirt")
    };

    if(sessionStorage.getItem('fname') != null) form.fname.value = sessionStorage.getItem('fname');
    if(sessionStorage.getItem('mi') != null) form.mi.value = sessionStorage.getItem('mi');
    if(sessionStorage.getItem('lname') != null) form.lname.value = sessionStorage.getItem('lname');
    if(sessionStorage.getItem('email') != null) form.email.value = sessionStorage.getItem('email');
    if(sessionStorage.getItem('major') != null) form.major.value = sessionStorage.getItem('major');
    if(sessionStorage.getItem('classification') != null) form.classification.value = sessionStorage.getItem('classification');
    if(sessionStorage.getItem('grad_date') != null) form.grad_date.value = sessionStorage.getItem('grad_date');
    if(sessionStorage.getItem('tshirt') != null) form.tshirt.value = sessionStorage.getItem('tshirt');
}
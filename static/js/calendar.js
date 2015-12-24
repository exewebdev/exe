var dateObject = new Date();
var month = dateObject.getMonth();
var monthArray = new Array("January","February","March","April","May","June","July","August","September","October","November","December");

function getTodayDate() {
     var dateToday = monthArray[month] + " " + dateObject.getDate() + ", " + dateObject.getFullYear();
        document.forms[1].grad_date.value = dateToday;
}

function displayCalendar(whichMonth) {
    var calendarWin = window.open("", "CalWindow", "status=no,resizable=yes,width=400,height=220,left=200,top=200");
    calendarWin.focus();
    calendarWin.document.write("<!DOCTYPE html>");
    calendarWin.document.write("<html><head><title>EXE Computer Science Club<\/title>");
    calendarWin.document.write("<meta charset='UTF-8' name='viewport' content='width=device-width, initial-scale=1'>");
    calendarWin.document.write("<link rel='stylesheet' type='text\/css' href='/css/style.css' \/><\/head><body>");
    calendarWin.document.write("<table cellspacing='0' border='1' width='100%'>");

    calendarWin.document.write("<colgroup span='7' width='50' \/>");

    if (whichMonth == -1)
        dateObject.setMonth(dateObject.getMonth() - 1);
    else if (whichMonth == 1)
        dateObject.setMonth(dateObject.getMonth() + 1);

    var month = dateObject.getMonth();
    calendarWin.document.write("<tr><td colspan='2'> <a href= ' ' "
        + " onclick = 'self.opener.displayCalendar(-1); return false'>Previous</a></td>"
        + "<td colspan = '3' align = 'center'>"
        + "<strong>" + monthArray[month] + " " + dateObject.getFullYear() +"</strong></td>"
        + "<td colspan = '2' align='right'> <a href='' "
        + " onclick='self.opener.displayCalendar(1); return false'>Next</a></td></tr>");

    calendarWin.document.write("<tr align='center'><td>Sun<\/td><td>Mon<\/td><td>Tue<\/td><td>Wed<\/td><td>Thu<\/td><td>Fri<\/td><td>Sat<\/td><\/tr>");
    calendarWin.document.write("<tr align='center'>");

    dateObject.setDate(1);
    var dayOfWeek = dateObject.getDay();
    for (var i=0; i<dayOfWeek; ++i) {
        calendarWin.document.write("<td>&nbsp;<\/td>");
    }

    var daysWithDates = 7 - dayOfWeek;
    var dateCounter = 1;
    for (var j=0; j<daysWithDates; ++j) {
        var curDate = monthArray[month] + " " + dateCounter + ", " + dateObject.getFullYear();
        calendarWin.document.write("<td><a href='' onclick='self.opener.document.forms[1].grad_date.value=\"" + curDate + "\";self.close()'>" + dateCounter + "<\/a><\/td>");
        ++dateCounter;
    }
    calendarWin.document.write("</tr>");

    var numDays = 0;
    numDays = daysInMonth(month, dateObject.getFullYear());

    // ********************************************************
    // the code specified for getting days of month on pg 328
    // is flawed. It does not take into account whether the year
    // is leap year which changes the number of days in Feb
    // daysInMonth function takes care of days in leap and non-leap years
    // this snippet came from http://snippets.dzone.com/posts/show/2099
    function daysInMonth(iMonth, iYear)
    {
        return 32 - new Date(iYear, iMonth, 32).getDate();
    }

    for (var rowCounter = 0; rowCounter < 5; ++rowCounter) {
        var weekDayCounter = 0;
        calendarWin.document.write("<tr align='center'>");
        // This ends step 8 on page 328  -- the last line and closing brace are now below step 9.

        // This is step 9 on pages 328 - 329.  After the href looks like a double quote on the monitor, but it is 2 single quotes.
        while (weekDayCounter < 7) {
            curDate = monthArray[month] + " " + dateCounter + ", " + dateObject.getFullYear();
            if (dateCounter <= numDays)
                calendarWin.document.write("<td><a href='' onclick='self.opener.document.forms[1].grad_date.value=\"" + curDate + "\";self.close()'>" + dateCounter + "<\/a><\/td>");
            else
                calendarWin.document.write("<td>&nbsp;<\/td>");
            ++weekDayCounter;
            ++dateCounter;
        }
        calendarWin.document.write("<\/tr>");
    }

    calendarWin.document.write("<\/table><\/body><\/html>");
    calendarWin.document.close();
}
<?php print "<!DOCTYPE html>
  <html>
  		<head>
			<title>Form Confirmation</title>
  			<link rel=\"stylesheet\" href=\"css\styles.css\" type=\"text/css\" />
  		</head>
  		<body>
  			<h1>Your information has been received</h1>";

			$message = "";
  			foreach ($_POST as $key=>$value) {
				$message .= $key.":".$value."<br>\r\n";
  			}

  			print $message;

  			print "<br>
  			<br>
  			<br>
  			<br>
  			<br>
  			<br>
  			<form action=\"#\">
  				<input type=\"button\" value=\"Back\" onclick=\"javascript:history.go(-1)\" />
			</form>
  		</body>
  	</html>"
 ?>
  
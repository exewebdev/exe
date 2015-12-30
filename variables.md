# Environment Variables
To assist with configuration (and to avoid pushing API keys to this repo) the server can be configrured entirely with environment variables.

## Database

`CLEARDB_DATABASE_URL` - a MySQL URL for the app to use - e.g. `mysql://user.password@dbhostname.com/databasename`  Can be used in place of configuring other MySQL variables.

`DATABSE_HOST` - the hostname of the databse to connect to (for devlopment, this is probably `localhost`).

`DATABASE_USER` - the user to connect to the DB as.

`DATABASE_PASSWORD` - the databse user's password.

`DATABASE_NAME` - the name of the databse to connect to (if you `SOURCE databse_schema/databse_implementation.sql` to configure the DB, this will be `txstexe`).


## API Keys / Authentication

### Facebook (for Facebook logins)
`FB_CLIENTID` - the Facebook application's client ID, obtained from https://developers.facebook.com/apps/

`FB_CLIENTSECRET` - the secret for your Facebook app

`FB_CALLBACKURL` - The address of the app, followed by `/login/facebook/callback`, e.g. `https://myhost.com/login/facebook/callback`.

### Google (for calendar functions)
`GOOGLE_CALENDAR_ID` - The name of the calendar to use for the event adds feature.

`GOOGLE_CLIENT_EMAIL` - The name of the account that will post to the calendar.  Must be granted edit permissions to the calendar.

`GOOGLE_CLIENT_PK` - A PKCS12 private key used for authenticating the account.

These can all be obtained from the Google Developer Console at https://console.developers.google.com/projectselector/permissions/serviceaccounts - you will need to generate a service account and download the file it provides you, then use that to configure the variables OR save the file as `google-svc-auth.json` and the app will automatically load in the values - no environment variables needed.
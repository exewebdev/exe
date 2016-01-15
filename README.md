# exe
[![Build Status](https://travis-ci.org/exewebdev/exe.svg?branch=master)](https://travis-ci.org/exewebdev/exe)

Project for Texas State Computer Science Club

# Installing & Running

This repository requires node.js, availible for free for all platforms on https://nodejs.org/en/.

After you have node.js installed, the repository can be installed with 

`npm install`

and can be run with

`node app.js`

Please note that the server configuration requires a running MySQL server for the join page to work properly.

If you wish to develop for the site without a MySQL server (for testing page style, for example) you will need to change the line in config.js with 

`enabled: true`

to 

`enabled: false`

Using `nodemon` for development is recommended.  More information can be found [here](https://github.com/remy/nodemon).

# Swig templates

This site uses the Swig templating engine for easy site maintainability.

The base template for the site can be found in `template.html`, and an
example that uses the template can be found in `swig_example.html`.

For more information about Swig, [please refer to the official documentation](http://paularmstrong.github.io/swig/docs/).

# Testing

Want your shiny new commit to hit Heroku?  Build faling?  NO DEPLOY!

If you want your changes on live, it needs to pass our CI tests, which are ran using Grunt.
Testing locally is easy, too:

```
    npm install -g grunt
    grunt
```

(Linux/OS X users may need to add `sudo` before the `npm` command,
and Windows users will need to run the npm command in a shell with admin privleges.)

After you first run the `npm install -g grunt` command, all future tests can be done simpily by running `grunt`.

If the script finishes with `Done, without errors.` then it will be deployed automagically when you commit!

If it responds with `Aborted due to warnings.` then you need to fix your code before you push.

Remember, a green build status is a happy build status, so test before you push :D

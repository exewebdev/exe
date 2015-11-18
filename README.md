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

Using `nodemon` for development is recommeded.  More information can be found [here](https://github.com/remy/nodemon).

# Swig templates

This site uses the Swig templating engine for easy site maintianablility.

The base template for the site can be found in `template.html`, and an
example that uses the template can be found in `swig_example.html`.

For more information about Swig, [please refer to the official documantation](http://paularmstrong.github.io/swig/docs/).
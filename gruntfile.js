module.exports = function(grunt) {
    // Project configuration. 
    grunt.initConfig({
        jshint: {
            all: ['./*.js']
        },
        swig: {
            development: {
                init: {
                    autoescape: true
                },
                dest: "www/",
                src: ['static/**/*.html']
            },
            html: {
                all: ["static/**/*.html"]
            }
        },
        htmllint: {
            all: ["www/**/*.html"],
            options: {
                ignore: ['The “scrolling” attribute on the “iframe” element is obsolete. Use CSS instead.',  //thrown by embedded calendars, kept for IE compatibility
                        'Empty heading.', //thrown by unpopulated templates, namely profile pages.  eventually remove.
                        'The “date” input type is not supported in all browsers. Please be sure to test, and consider using a polyfill.'] //to be solved, but suppress for now.
            }
        },
        csslint: {
            strict: {
                options: {
                    import: 2,
                    ids: false
                },
            src: ['static/css/style.css']
        }
    }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-swig');
    grunt.loadNpmTasks('grunt-html');
    grunt.loadNpmTasks('grunt-contrib-csslint');

    grunt.registerTask('default', ['jshint', 'swig', 'htmllint', 'csslint']);
};
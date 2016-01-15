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
    }, accessibility: {
            options : {
                accessibilityLevel: 'WCAG2A',
                 reportLevels: {
                    notice: false,
                    warning: false,
                    error: true
                },
                //the following are ignored by the accessability checker - if edited, please leave rationale for doing so!
                ignore :[
                    "WCAG2A.Principle2.Guideline2_4.2_4_1.H64.1", //ignored because many generated iframes do not create titles, esp. stripe's iframe which cannot be manually retitled
                    "WCAG2A.Principle1.Guideline1_3.1_3_1.H42.2" //ignored because headers are populated on live site, but not on swig prerenders
                ]
            },
            test : {
              src: ['www/**/*.html']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-swig');
    grunt.loadNpmTasks('grunt-html');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-accessibility');
    
    grunt.registerTask('default', ['jshint', 'swig', 'htmllint', 'csslint', 'accessibility']);
};
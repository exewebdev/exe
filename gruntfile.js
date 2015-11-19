module.exports = function(grunt){
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
          src: ['static/**/*.html'],
          generateSitemap: true,
          generateRobotstxt: true,
          siteUrl: 'http://mydomain.net/',
          production: false,
          fb_appid: '1349v',
          ga_account_id: 'UA-xxxxxxxx-1',
          robots_directive: 'Disallow /',
          sitemap_priorities: {
              '_DEFAULT_': '0.5',
              'index.html': '0.8',
              'subpage.html': '0.7'
          }
        },
        html: {
            all: ["static/**/*.html"]
        }
    }, htmllint: {
            all: ["www/**/*.html"]
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-swig');
    grunt.loadNpmTasks('grunt-html');
    
    grunt.registerTask('default', ['jshint', 'swig', 'htmllint']);
};
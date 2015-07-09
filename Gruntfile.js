'use strict';

module.exports = function (grunt) {

  var path = require('path'),
      buildoutBin = path.join(path.dirname(__filename), 'bin');


  // Ensure buildout-installed executables are used over globally-installed versions
  process.env.PATH = buildoutBin + ':' + process.env.PATH;

  // Load tasks automatically
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    watch: {
      options: {
        atBegin: true
      },
      publicLess: {
        files: 'src/conjthis/conjthis/public/static/public/src/less/*.less',
        tasks: ['less']
      }
    },

    less: {
      public: {
        files: {
          "src/conjthis/conjthis/public/static/public/dist/main.css": "src/conjthis/conjthis/public/static/public/src/less/main.less"
        }
      }
    }

  });

  grunt.registerTask('build', [
    'closureBuilder'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
};

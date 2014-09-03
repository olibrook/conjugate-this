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
        files: 'src/roomies/roomies/public/static/public/src/less/*.less',
        tasks: ['less']
      }
    },

    less: {
      public: {
        files: {
          "src/roomies/roomies/public/static/public/dist/main.css": "src/roomies/roomies/public/static/public/src/less/main.less"
        }
      }
    },

    requirejs: {
      public: {
        options: {
          baseUrl: "src/roomies/roomies/public/static/",
          mainConfigFile: "src/roomies/roomies/public/static/publicConfig.js",
          out: "src/roomies/roomies/public/static/public/dist/main.min.js",
          name: 'public/lib/almond/almond',
          include: "publicConfig"
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

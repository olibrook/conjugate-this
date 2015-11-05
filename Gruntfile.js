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
        files: 'public/src/less/*.less',
        tasks: ['less']
      }
    },

    less: {
      public: {
        files: {
          "public/dist/main.css": "public/src/less/main.less"
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 8000,
          base: 'public',
          keepalive: true,
          debug: true
        }
      }
    }

  });
};

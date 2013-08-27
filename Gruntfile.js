module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      src: {
        src: ['src/**/*.js']
      },

      test: {
        src: ['test/**/*.js'],
        options: {
          expr: true,
          ignores: ['test/lib/*.js']
        }
      }

    },

    qunit: {
      all: ['test/*.html']
    },

    watch: {
      files: ['<%= jshint.src.src %>', '<%= jshint.test.src %>'],
      tasks: ['jshint', 'qunit']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-qunit');

  grunt.registerTask('default', ['jshint', 'qunit', 'watch']);

}

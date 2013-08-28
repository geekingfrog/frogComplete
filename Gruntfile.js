module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['src/**/*.js', 'test/**/*.js', 'Gruntfile.js'],
      options: {
        ignores: ['test/lib/*.js']
      }

    },

    qunit: {
      all: ['test/*.html']
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'qunit']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-qunit');

  grunt.registerTask('default', ['jshint', 'qunit', 'watch']);

};

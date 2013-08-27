module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      src: {
        src: ['src/**/*.js']
      },

      test: {
        src: ['test/**/*.js'],
        options: {expr: true}

      }

    },

    mochaTest: {
      test: {
        options: { reporter: 'spec' },
        src: ['test/**/*.js']
      }
    },

    watch: {
      files: ['<%= jshint.src.src %>', '<%= jshint.test.src %>'],
      tasks: ['jshint']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', ['jshint', 'mochaTest', 'watch']);

}

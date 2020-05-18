module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '// Materials Cloud bands structure widget v<%= pkg.version %>\n' +
          '// <%= grunt.template.today("yyyy-mm-dd") %>, MIT License\n'
    },

    uglify: {
      options: {
        mangle: true,
        banner: '<%= meta.banner %>'
      },
      dist: {
        files: {
          'dist/mcloud-bands-widget.min.js': ['js/bandstructure.js']
        }
      }
    },

    jshint: {
      options: {
        browser: true,
        sub: true,
        globals: {
          jQuery: true
        }
      },
      all: {
        src: ['js/bands.js', 'js/bandstructure.js']
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('build', ['jshint', 'uglify']);

};
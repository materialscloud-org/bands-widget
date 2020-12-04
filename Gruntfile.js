module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '// Materials Cloud bands structure widget v<%= pkg.version %>\n' +
                '// https://www.materialscloud.org\n' +
                '// Contributors: <%= pkg.author %>\n' +
                '// (c) <%= grunt.template.today("yyyy") %>, Released under the MIT License\n'
        },

        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: "dist/{,*/}*"
                }]
            }
        },

        concat: {
            options: {
                separator: ';',
                nonull: true
            },
            dist: {
                src: [
                     'js/hammer.min.js',
                     'js/chartjs.min.js',
                     'js/chartjs-plugin-zoom.min.js',
                     'js/tinycolor.min.js',
                     'dist/bandstructure.min.js'],
                dest: 'dist/bandstructure.min.js'
            }
        },

        // minifies JS files
        uglify: {
            options: {
                mangle: true,
                banner: '<%= meta.banner %>'
            },
            dist: {
                files: {
                    'dist/bandstructure.min.js': ['js/bandstructure.js']
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


    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('build', [
        'clean',
        'jshint',
        'uglify',
        'concat'
    ]);

};

module.exports = function(grunt) {
grunt.initConfig({
    copy: {
        main: {
            files: [
                {expand: true, flatten: true, src: ['src/hgrid.js'], dest: 'build/', filter: 'isFile'},
                {expand: true, flatten: true, src: ['src/tests.js'], dest: 'build/', filter: 'isFile'}
            ]
        }
    },

	uglify: {
	    options: {
		mangle: true
	    },
	    my_target: {
		files: {
		    'build/slickgrid.custom.min.js': [
                'vendor/hgrid_dependencies/slick.core.js',
                'vendor/hgrid_dependencies/slick.grid.js',
                'vendor/hgrid_dependencies/slick.dataview.js',
                'vendor/hgrid_dependencies/slick.rowselectionmodel.js',
                'vendor/hgrid_dependencies/slick.rowmovemanager.js']
			}
	    }
	   },

    qunit: {
        all: ['examples/example.html']
    }
    });
// Load the plugin that provides the "uglify" task.
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-qunit');
//grunt.loadNpmTasks('grunt-contrib-cssmin')

// Default task(s).
grunt.registerTask('default', ['uglify' , 'copy', 'qunit']);

};
module.exports = function(grunt) {
grunt.initConfig({
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
	   }
//	cssmin: {
//		minify: {
//			expand: true,
//			cwd: 'app/static/css/',
//			src: ['*.css'],
//			dest: 'app/static/css/',
//			ext: '.min.css'
//	},
//	combine: {
//		files: {
//			'app/static/css/hgrid.min.css': ['app/static/css/slick.min.css', 'app/static/css/jquery-ui-1.min.css', 'app/static/css/examples.min.css', 'app/static/css/file-viewer-core.min.css']
//		}
//	}
//}
    });
// Load the plugin that provides the "uglify" task.
grunt.loadNpmTasks('grunt-contrib-uglify');
//grunt.loadNpmTasks('grunt-contrib-cssmin')

// Default task(s).
grunt.registerTask('default', ['uglify']);//, 'cssmin']);

};
module.exports = function(grunt) {
grunt.initConfig({
	uglify: {
	    options: {
		mangle: false
	    },
	    my_target: {
		files: {
		    'app/static/js/hgrid.min.js': ['app/static/js/dropzone.js','app/static/js/file-viewer-dropzone.js','app/static/js/slick-grid-dependencies/slick.core.js','app/static/js/slick-grid-dependencies/slick.formatters.js','app/static/js/slick-grid-dependencies/slick.editors.js','app/static/js/slick-grid-dependencies/slick.grid.js','app/static/js/slick-grid-dependencies/slick.dataview.js','app/static/js/slick-grid-dependencies/slick.cellrangeselector.js','app/static/js/slick-grid-dependencies/slick.cellselectionmodel.js','app/static/js/slick-grid-dependencies/slick.rowselectionmodel.js','app/static/js/slick-grid-dependencies/slick.rowmovemanager.js', 'app/static/js/hgrid.js']
			}
	    }
	   },
	cssmin: {
		minify: {
			expand: true,
			cwd: 'app/static/css/',
			src: ['*.css'],
			dest: 'app/static/css/',
			ext: '.min.css'
	},
	combine: {
		files: {
			'app/static/css/hgrid.min.css': ['app/static/css/slick.min.css', 'app/static/css/jquery-ui-1.min.css', 'app/static/css/examples.min.css', 'app/static/css/file-viewer-core.min.css']
		}
	}
}
    });
// Load the plugin that provides the "uglify" task.
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-cssmin')

// Default task(s).
grunt.registerTask('default', ['uglify', 'cssmin']);

};
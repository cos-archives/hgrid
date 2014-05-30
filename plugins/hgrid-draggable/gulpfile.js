var gulp = require('gulp');

var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var qunit = require('gulp-qunit');


var NAME = 'hgrid-draggable.js';
var NAME_MIN = 'hgrid-draggable.min.js';
var DEFAULT_ACTIONS = ['compress', 'test'];

gulp.task('test', function() {
  gulp.src('./tests/index.html')
    .pipe(qunit());
});

gulp.task('compress', function() {
  return gulp.src(NAME)
    .pipe(uglify())
    .pipe(rename(NAME_MIN))
    .pipe(gulp.dest('.'));
});

gulp.task('watch', function () {
  gulp.watch('*.js', ['test']);
  gulp.watch('tests/*.js', ['test']);
});

gulp.task('default', DEFAULT_ACTIONS);

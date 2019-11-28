const gulp = require('gulp');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');

require('@babel/polyfill');

// Lint Task
function lint() {
  return gulp.src(['src/*.js', 'test/*.js'])
    .pipe(eslint())
    .pipe(eslint.format());
}

// Assemble script
function scripts() {
  return gulp.src('src/superagent-jsonp.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
}

exports.lint = lint;
exports.scripts = scripts;
exports.default = gulp.series(lint, scripts);

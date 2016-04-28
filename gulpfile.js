const gulp = require('gulp')
const babel = require('gulp-babel')
const cache = require('gulp-cached')
const concat = require('gulp-concat-util');

const path = 'lib/**/*'

gulp.task('transpile', () => {
  return gulp.src(path)
  .pipe(cache('transpile'))
  .pipe(babel())
  .pipe(concat.header('var regeneratorRuntime = require(\'babel-regenerator-runtime\');'))
  .pipe(gulp.dest('dist'))
})

gulp.task('watch', () => {
  gulp.watch(path, ['transpile'])
})

gulp.task('default', ['watch', 'transpile'])

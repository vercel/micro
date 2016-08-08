import gulp from 'gulp'
import babel from 'gulp-babel'
import cache from 'gulp-cached'
import concat from 'gulp-concat-util'

const path = 'lib/**/*'

gulp.task('transpile', () => gulp.src(path)
  .pipe(cache('transpile'))
  .pipe(babel())
  .pipe(concat.header('var regeneratorRuntime = require(\'babel-regenerator-runtime\');'))
  .pipe(gulp.dest('dist')))

gulp.task('watch', () => {
  gulp.watch(path, ['transpile'])
})

gulp.task('default', ['watch', 'transpile'])

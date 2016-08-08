import gulp from 'gulp'
import babel from 'gulp-babel'
import cache from 'gulp-cached'
import concat from 'gulp-concat-util'

const paths = {
  bin: 'bin/*',
  lib: 'lib/**/*'
}

gulp.task('bin', () => gulp.src(paths.bin)
  .pipe(cache('transpile-bin'))
  .pipe(babel())
  .pipe(gulp.dest('dist/bin')))

gulp.task('lib', () => gulp.src(paths.lib)
  .pipe(cache('transpile-lib'))
  .pipe(babel())
  .pipe(concat.header('var regeneratorRuntime = require(\'babel-regenerator-runtime\');'))
  .pipe(gulp.dest('dist/lib')))

gulp.task('watch', () => {
  gulp.watch(paths.bin, ['bin'])
  gulp.watch(paths.lib, ['lib'])
})

gulp.task('transpile', ['bin', 'lib'])
gulp.task('default', ['watch', 'transpile'])

import gulp from 'gulp'
import cache from 'gulp-cached'
import help from 'gulp-task-listing'
import babel from 'gulp-babel'
import ext from 'gulp-ext'

import del from 'del'

const path = 'bin/**/*'

gulp.task('help', help)
gulp.task('clean', () => del(['build']))

gulp.task('transpile', () => gulp.src(path)
  .pipe(cache('bin'))
  .pipe(babel())
  .pipe(ext.crop())
  .pipe(gulp.dest('dist')))

gulp.task('watch', () => gulp.watch(path, ['transpile']))
gulp.task('default', ['watch', 'transpile'])

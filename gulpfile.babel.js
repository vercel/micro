import gulp from 'gulp'
import cache from 'gulp-cached'
import help from 'gulp-task-listing'
import babel from 'gulp-babel'
import ext from 'gulp-ext'

import del from 'del'

gulp.task('help', help)
gulp.task('clean', () => del(['build']))

gulp.task('default', () => gulp.src('bin/**/*')
  .pipe(cache('bin'))
  .pipe(babel())
  .pipe(ext.crop())
  .pipe(gulp.dest('build')))

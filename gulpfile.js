const gulp = require('gulp')
const del = require('del')
const cache = require('gulp-cached')
const eslint = require('gulp-eslint')
const help = require('gulp-task-listing')
const ava = require('gulp-ava')
const babel = require('gulp-babel')
const ext = require('gulp-ext')

gulp.task('help', help)

gulp.task('compile', [
  'compile-bin',
  'compile-test'
])

gulp.task('compile-bin', () => {
  return gulp.src('bin/**/*')
  .pipe(cache('bin'))
  .pipe(babel())
  .pipe(ext.crop())
  .pipe(gulp.dest('build/bin'))
})

gulp.task('compile-test', () => {
  return gulp.src('test/*.js')
  .pipe(cache('test'))
  .pipe(babel())
  .pipe(gulp.dest('build/test'))
})

gulp.task('test', ['compile'], () => {
  return gulp.src('build/test/*.js')
  .pipe(ava())
})

gulp.task('lint', () => {
  return gulp.src([
    'gulpfile.js',
    'test/*.js',
    'bin/*'
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
})

gulp.task('clean', () => del(['build']))
gulp.task('default', ['lint', 'compile', 'test'])

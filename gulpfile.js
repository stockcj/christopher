const gulp = require('gulp');
const concat = require('gulp-concat');
const child = require('child_process');
const gutil = require('gulp-util');
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const mainBowerFiles = require('main-bower-files');
const filter = require('gulp-filter');
const uglify = require('gulp-uglify');
const order = require('gulp-order');
const clean = require('gulp-clean-css');
const inject = require('gulp-inject');
const series = require('stream-series');
const htmlreplace = require ('gulp-html-replace')
const ghpages = require('gulp-gh-pages')

const siteRoot = '_site';

gulp.task('dependencies', () => {

    const bowerJs = gulp.src(mainBowerFiles({overrides: {materialize: {ignore: [true]}}}))
        .pipe(filter('**/*.js', {dot: true}))
        .pipe(order([
            'jquery.js',
            'jquery.fullPage.js',
            '*'
        ]))

    const bowerCss = gulp.src(mainBowerFiles())
        .pipe(filter('**/*.?(s)css', {dot: true}))

    const cssFile = gulp.src('./dev/css/**/*.css')
    
    gulp.src('./dev/head/head.html')
        .pipe(inject(series(bowerCss, cssFile, bowerJs), {relative: true}))
        .pipe(gulp.dest('./dev/head'))
})

gulp.task('update', () => {
    gulp.src(['./dev/**/*.html', '!./dev/head.html'])
        .pipe(gulp.dest('./_includes'))

    gulp.src('./dev/head.html')
    .pipe(htmlreplace({
        'css': 'css/main.css',
        'js': 'js/main.js'
    }))
    .pipe(gulp.dest('./_includes'));
})

gulp.task('css', () => {

	var cssFiles = ['./dev/css/**/*.css'];

	gulp.src(mainBowerFiles().concat(cssFiles))
		.pipe(filter('**/*.?(s)css', {dot: true}))
		.pipe(concat('main.css'))
        .pipe(autoprefixer('last 2 versions'))
		.pipe(clean())
		.pipe(gulp.dest('./css'));
});

gulp.task('js', () => {

    var jsFiles = ['./dev/js/**/*.js'];

    gulp.src(mainBowerFiles({overrides: {materialize: {ignore: [true]}}}).concat(jsFiles))
        .pipe(filter('**/*.js', {dot: true}))
        .pipe(order([
            'jquery.js',
            'jquery.fullPage.js',
            '*'
        ]))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./js'))
});

gulp.task('jekyll', () => {
    const jekyll = child.spawn('jekyll.bat', ['build',
    '--watch',
    '--incremental',
    '--drafts'
    ]);

    const jekyllLogger = (buffer) => {
        buffer.toString()
        .split(/\n/)
        .forEach((message) => gutil.log('Jekyll: ' + message));
    };

    jekyll.stdout.on('data', jekyllLogger);
    jekyll.stderr.on('data', jekyllLogger);
});

gulp.task('serve', function() {
    browserSync.init({
        files: [siteRoot + '/**'],
        port: 4000,
        server: {
            baseDir: siteRoot
        }
    });

    gulp.watch('./dev/**/*.css', ['css']);
    gulp.watch('./dev/**/*.js', ['js']);
    gulp.watch('./dev/*.html', ['update']);
});

gulp.task('deploy', () => {
    gulp.src('./_site/**/*')
        .pipe(ghpages())
})

gulp.task('default', ['dependencies', 'update', 'css', 'js', 'jekyll', 'serve']);
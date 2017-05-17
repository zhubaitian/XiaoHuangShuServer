const gulp = require('gulp');
const nodemon = require('gulp-nodemon');

gulp.task('nodemon', function () {
    return nodemon({
        verbose: false,
        exec: 'node --inspect',
        script: 'server/server.js',
		ext: 'js',
        watch: ['server'],
        delay: 2000,
    })
});

gulp.task('dev',['nodemon'], function () {
    console.log('dev started....');
});

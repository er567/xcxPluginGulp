const gulp = require('gulp');
const colors = require("colors");
const pump = require('pump');
const jsonminify = require('gulp-json-minify');
const cssnano = require('gulp-cssnano');
const imagemin = require('gulp-imagemin');
const del = require('del');
const replace = require('gulp-replace');
const uglyfly = require('gulp-uglifyes');
const $ = require('gulp-load-plugins')();
const babel = require("gulp-babel");    // 用于ES6转化ES5
var sourcemaps = require("gulp-sourcemaps");
// 配置项(套用可以压缩css/wxss、js、json、html/wxml)
const conf = {
	// 开发目录
	devPath: 'src',
	// 编译目录
	prodPath: 'dist',
	filesPath: {
		// js文件
		js: '/**/*.js',
		// wxss文件
		wxss: '/**/**.wxss',
		// wxml文件
		wxml: '/**/**.wxml',
		// json文件
		json: '/**/**.json',
		// 图片文件(jpg|jpeg|png|gif)
		images: '/**/{**.jpg,**.jpeg,**.png,**.gif}',
		// 矢量图(svg)
		svg: '/**/**.svg',
		// wxs
		wxs: '/**/**.wxs',
	}
};

// 显示时间
const getTime = function () {
	return '[' + colors.white(new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds()) + '] ';
};

// 输出log
const _log = function (msg) {
	console.log(getTime() + msg);
};

/**
 * 优化js文件
 * @param filePath
 */
const _optJS = function (filePath, cb) {
	const options = {};
	_log(colors.green('对 js 文件进行优化...'));
	pump([
		gulp.src(filePath, { base: conf.devPath }),
		uglyfly({
			mangle: false,
			ie8: true,//压缩后的代码支持ie8
			ecma: 8,//支持的javascript的最高版本(兼容es5,6,7,8)
			compress: {}//压缩的级别
		}),
		// sourcemaps.init(),
		babel(),
		// sourcemaps.write("."),
		gulp.dest(conf.prodPath)
	], cb);
};

/**
 * 优化wxss文件
 * @param filePath
 */
const _optWXSS = function (filePath, cb) {
	const options = {
		debug: false,
		inline: ['none']
	};
	_log(colors.green('对 wxss 文件进行优化...'));
	gulp.src(filePath, { base: conf.devPath })
		.pipe(cssnano())
		.pipe(gulp.dest(conf.prodPath));
	cb();
};

/**
 * 优化json文件
 * @param filePath
 * @private
 */
const _optJSON = function (filePath, cb) {
	_log(colors.green('对 json 文件进行优化...'));
	gulp.src(filePath, { base: conf.devPath })
		.pipe(jsonminify())
		.pipe(gulp.dest(conf.prodPath));
	cb();
};

/**
 * 优化wxml文件
 * @param filePath
 * @private
 */
const _optWXML = function (filePath, cb) {
	_log(colors.green('对 wxml 文件进行优化...'));
	gulp.src(filePath, { base: conf.devPath })
		// 删除换行符和tab缩进
		.pipe(replace(/\n+|\t+/g, ''))
		// 将连续空格替换为单个空格
		.pipe(replace(/\s+/g, ' '))
		// 将" <"和"> "的空格删除
		.pipe(replace(/(>\s)/g, '>'))
		.pipe(replace(/(\s<)/g, '<'))
		// 删除注释
		.pipe(replace(/<!--[\w\W\r\n]*?-->/g, ''))
		.pipe(gulp.dest(conf.prodPath));
	cb();
};

/**
 * 优化图片文件
 * @param filePath
 * @private
 */
const _optImages = function (filePath, fileType) {
	_log(colors.green('对 ' + fileType + ' 文件进行优化...'));
	gulp.src(filePath, { base: conf.devPath })
		.pipe(imagemin([
			imagemin.gifsicle(),
			imagemin.jpegtran(),
			imagemin.optipng(),
			imagemin.svgo()
		], [
				{ optimizationLevel: 3 },
				{},
				{ optimizationLevel: 7 },
				{}
			], true))
		.pipe(gulp.dest(conf.prodPath));
};

/**
 * 复制文件
 * @param filePath
 */
const _copyFiles = function (filePath, cb) {
	_log(colors.green('将 ' + conf.devPath + ' 输出到 ' + conf.prodPath));
	gulp.src(filePath, { base: conf.devPath })
		.pipe(gulp.dest(conf.prodPath));
	if (!!cb) {
		cb();
	}
};

// 监听任务
gulp.task('watch', ['clean'], function (cb) {
	// 文件列表
	const _files = [
		conf.devPath + conf.filesPath.js,
		conf.devPath + conf.filesPath.wxss,
		conf.devPath + conf.filesPath.json,
		conf.devPath + conf.filesPath.wxml,
		conf.devPath + conf.filesPath.images,
		conf.devPath + conf.filesPath.svg
	];

	// 复制文件到dist目录
	_copyFiles(_files, cb);

	// 监听文件变化
	_log(colors.magenta('开始监听文件变化(Ctrl-C退出)...'));
	gulp.watch(_files, function (event) {
		_log(colors.green('File ' + event.path + ' was ' + event.type + ', running tasks...'));
		_copyFiles(event.path);
	});
});

// 清理编译目录
gulp.task('clean', function (cb) {
	_log(colors.white('开始清理 ' + conf.prodPath + ' 目录...'));
	// cb();
	/*    gulp.src([conf.devPath,app.prdPath])
					.pipe($.clean());*/
	del([conf.prodPath] + '/**/*').then(function (paths) {
		_log(colors.white('清理完毕, 共清理 ' + colors.red(paths.length) + ' 个文件和目录。'));
		cb();
	});
});

// 优化js
gulp.task('js', ['clean'], function (cb) {
	const _files = conf.devPath + conf.filesPath.js;
	_optJS(_files, cb);
});
// 优化wxss
gulp.task('wxss', ['clean'], function (cb) {
	const _files = conf.devPath + conf.filesPath.wxss;
	_optWXSS(_files, cb);
});
// 优化wxml
gulp.task('wxml', ['clean'], function (cb) {
	const _files = conf.devPath + conf.filesPath.wxml;
	_optWXML(_files, cb);
});
// 优化json
gulp.task('json', ['clean'], function (cb) {
	const _files = conf.devPath + conf.filesPath.json;
	_optJSON(_files, cb);
});
// 优化图片
gulp.task('images', ['clean'], function () {
	const _files1 = conf.devPath + conf.filesPath.images;
	const _files2 = conf.devPath + conf.filesPath.svg;
	_optImages(_files1, 'jpg/jpeg/png/gif');
	_optImages(_files2, 'svg');
});
// 移动wxs
gulp.task('wxs', ['clean'], function (cb) {
	const _files = conf.devPath + conf.filesPath.wxs;
	_copyFiles(_files, cb);
});
// 开始任务
gulp.task('startProd', ['clean'], function () {
	_log(colors.green('开始(压缩)优化, 请稍候...'));
});

// 编译任务
gulp.task('prod', ['startProd', 'js', 'wxss', 'wxml', 'json', 'images', 'wxs'], function () {
	_log(colors.green('(压缩)优化完毕, 请查看 ' + conf.prodPath + ' 目录。'));
});
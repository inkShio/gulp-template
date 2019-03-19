// gulp-modules
var gulp       = require('gulp'),                         // сам gulp
	browserSync  = require('browser-sync').create(),        // локальный веб-сервер
	reload       = browserSync.reload,
	sass         = require('gulp-sass'),                    // сам scss
	globbing     = require('gulp-css-globbing'),            // добавляет globbing для scss (scss)
	fs           = require('fs'),
	jsonConcat   = require('gulp-json-concat'),             // клеим json файлы в 1 файл
	data         = require('gulp-data'),                    // читаем json в jade
	pug          = require('gulp-pug'),                     // html шаблонизатор pug (jade)
	csscomb      = require('gulp-csscomb'),                 // Сортировка CSS свойств
	gcmq         = require('gulp-group-css-media-queries'), // группируем медиа запросы
	imagemin     = require('gulp-imagemin'),                // минификатор картинок
	pngquant     = require('imagemin-pngquant'),            // минификатор png
	autoprefixer = require('gulp-autoprefixer'),            // автоматическая подстановка нужных css префиксов
	cleanCSS     = require('gulp-clean-css'),               // минификатор css
	uglify       = require('gulp-uglify'),                  // минификатор js
	concat       = require('gulp-concat'),                  // соединение файлов в один
	rename       = require('gulp-rename'),                  // изменение изначального имени файла на заданное
	plumber      = require('gulp-plumber'),                 // обработчик ошибок задач
	notify       = require('gulp-notify'),                  // уведомления
	clean        = require('gulp-clean'),                   // удаление файлов и папок
	svgSprite    = require('gulp-svg-sprite'),              // SVG спрайты
	svgmin       = require('gulp-svgmin'),                  // минификация SVG
	cheerio      = require('gulp-cheerio'),                 // удаление лишних атрибутов из svg
	replace      = require('gulp-replace'),                 // поиск и замены (у cheerio есть баг - иногда он преобразовывает символ ‘>’ в кодировку '&gt;' , поэтому этот плагин нам поможет)
	gulpIf       = require('gulp-if');                      // оператор If Else

// Переменные для тасков
var config = {
	suffix: '.min',
	autoprefixer: '> 0%',
	svg: {
		symbol: {
		    "shape": {
		        "id": {
		            "separator": "-"
		        }
		    },
		    "mode": {
		        "symbol": {
		            "dest": ".",
		            "sprite": "sprite.symbol.svg",
		            "layout": "diagonal",
		            "render": {
		            	"scss": {
		                    "template": "app/scss/svgTemplate/sprite.symbol.scss",
		                    "dest": "_sprite.symbol.scss"
		            	}
		            }
		        }
		    }
		},
		background: {
		    "shape": {
		        "id": {
		            "separator": "-"
		        }
		    },
		    "mode": {
		    	"css": {
		    		"dest": ".",
		    		"bust": false,
		    		"sprite": "../svg/sprite.background.svg",
		    		"layout": "diagonal",
		    		"dimensions": "-size",
		    		"prefix": ".",
		    		"render": {
		    			"scss": {
			    			"template": "app/scss/svgTemplate/sprite.background.scss",
			    			"dest": "_sprite.background.scss"
			    		}
		    		}
		    	}
		    }
		}
	}
};

// Пути для сборки
var paths = {
	build: {
		base: 'build/',
		style: 'build/css/',
		js: 'build/js/',
		images: 'build/images/',
		fonts: 'build/fonts/',
		content: 'build/content/',
		favicons: 'build/favicons/',
		svg: 'build/svg/'
	},
	scss: {
		styleDir: 'app/scss/',
		style: 'app/scss/style.scss',
		blocks: 'app/scss/blocks/**/*.scss',
		base: 'app/scss/base/**/*.scss',
		elements: 'app/scss/elements/**/*.scss',
		helpers: 'app/scss/helpers/**/*.scss',
		libs: 'app/scss/libs/**/*.scss'
	},
	js: {
		libs: 'app/js/libs/',
		scripts: 'app/js/scripts/'
	},
	pug: {
		pugDir: 'app/pug/',
		helpers: 'app/pug/helpers/**/*.pug',
		layouts: 'app/pug/layouts/**/*.pug',
		blocks: 'app/pug/blocks/**/*.pug',
		partials: 'app/pug/partials/**/*.pug',
		pages: 'app/pug/pages/**/*.pug'
	},
	json: {
		jsonDir: 'app/json/',
		data: 'app/json/**/*.json',
		finalData: 'tmp/data.json'
	},
	static: {
		content: 'app/static/content/**/*',
		fonts: 'app/static/fonts/*',
		images: 'app/static/images/**/*',
		favicons: 'app/static/favicons/*.*',
		svg: {
			symbol: 'app/static/svg/symbol/**/*.svg',
			background:'app/static/svg/background/**/*.svg'
		}
	}
};

gulp.task('svg-symbol', function () {
	return gulp.src(paths.static.svg.symbol)
		// Вывод ошибки
		.pipe(plumber({
			errorHandler: notify.onError({
				title: "svg-symbol error",
				Error: "<% error.message %>"
			})
		}))
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
				$('path[class]').removeAttr('class');
				$('style').remove();
			},
			parserOptions: {xmlMode: true}
		}))
		.pipe(replace('&gt;', '>'))
		.pipe(svgSprite(config.svg.symbol))
		.pipe(gulpIf('*.scss', gulp.dest('tmp/'), gulp.dest(paths.build.svg)));
});

gulp.task('svg-background', function () {
	return gulp.src(paths.static.svg.background)
		// Вывод ошибки
		.pipe(plumber({
			errorHandler: notify.onError({
				title: "svg-background error",
				Error: "<% error.message %>"
			})
		}))
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		.pipe(cheerio({
			run: function ($) {
				// Если svg background имеет несколько цветов, то это стоит закоментировать
				// $('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
				$('path[class]').removeAttr('class');
				$('style').remove();
			},
			parserOptions: {xmlMode: true}
		}))
		.pipe(replace('&gt;', '>'))
		.pipe(svgSprite(config.svg.background))
		.pipe(gulpIf('*.scss', gulp.dest('tmp/'), gulp.dest(paths.build.svg)));
});

// Таск локального веб сервера
gulp.task('serve', function() {
	browserSync.init({
		server: {
			baseDir: paths.build.base
		}
	});
});

// Соединяем все json файлы
gulp.task('json', function () {
	return gulp.src(paths.json.data)
		// Вывод ошибки
		.pipe(plumber({
			errorHandler: notify.onError({
				title: "json error",
				Error: "<% error.message %>"
			})
		}))
		// Собираем json файлы
		.pipe(jsonConcat('data.json', function(data){
			return new Buffer(JSON.stringify(data));
		}))
		// Кидаем в папку
		.pipe(gulp.dest('tmp/'))
		// Сообщение об успехе
		.pipe(notify({
			message: "json complete"
		}));
});

// Таск pug to html
gulp.task('pug-compile', function buildHTML() {
	return gulp.src(paths.pug.pages)
		// Вывод ошибки
		.pipe(plumber({
			errorHandler: notify.onError({
				title: "pug error",
				Error: "<% error.message %>"
			})
		}))
		// json данные для pug
		.pipe(data(function(file) {
			return JSON.parse(
				fs.readFileSync(paths.json.finalData)
			);
		}))
		// Собираем pug файлы
		.pipe(pug({
			pretty: true
		}))
		// Кидаем в папку
		.pipe(gulp.dest(paths.build.base))
		// Сообщение об успехе
		.pipe(notify({
			message: "pug complete"
		}));
});

// Выполняем таск pug-compile после выполняем перезагрузку
gulp.task('pug-reload', function() {
	return gulp.src(paths.build.base)
		// Перезагружаем страницу
		.pipe(reload({
			stream: true
		}));
});

// Таск стилей
gulp.task('style', function() {
	return gulp.src(paths.scss.style)
		// Вывод ошибки
		.pipe(plumber({
			errorHandler: notify.onError({
				title: "style error",
				Error: "<% error.message %>"
			})
		}))
		// Для поиска всех файлов sass (scss)
		.pipe(globbing({
			extensions: ['.scss']
		}))
		// Используем scss (scss)
		.pipe(sass({
			outputStyle: 'expanded'
		}))
		// Ставим префиксы
		.pipe(autoprefixer(config.autoprefixer))
		// Группируем медиа запросы
		.pipe(gcmq())
		// Упорядочим стили
		.pipe(csscomb())
		// Кидаем в папку
		.pipe(gulp.dest(paths.build.style))
		// Добавляем к названию min
		.pipe(rename({
			suffix: config.suffix
		}))
		// Минифицируем css
		.pipe(cleanCSS())
		// Кидаем в папку
		.pipe(gulp.dest(paths.build.style))
		// Грузим новый css без перезагрузки страницы
		.pipe(browserSync.stream())
		// Сообщение об успехе
		.pipe(notify({
			message: "scss complete"
		}));
});

// Таск jquery библиотек
gulp.task('libs', function() {
	return gulp.src(paths.js.libs + '*.min.js')
		// Вывод ошибки
		.pipe(plumber({
			errorHandler: notify.onError({
				title: "task error",
				Error: "<% error.message %>"
			})
		}))
		// Склеиваем все библиотеки в один файл
		.pipe(concat('libs.js'))
		// Кидаем в папку
		.pipe(gulp.dest(paths.build.js))
		// Грузим новый libs.js без перезагрузки страницы
		.pipe(browserSync.stream())
		// Сообщение об успехе
		.pipe(notify({
			message: "libs complete"
		}));
});

// Таск скриптов
gulp.task('scripts', function() {
	return gulp.src(paths.js.scripts + '*.js')
		// Вывод ошибки
		.pipe(plumber({
			errorHandler: notify.onError({
				title: "task error",
				Error: "<% error.message %>"
			})
		}))
		// Склеиваем все библиотеки в один файл
		.pipe(concat('scripts.js'))
		// Добавляем к названию min
		.pipe(rename({
			suffix: config.suffix
		}))
		// Минифицируем js
		.pipe(uglify())
		// Кидаем в папку
		.pipe(gulp.dest(paths.build.js))
		// Грузим новый scripts.min.js без перезагрузки страницы
		.pipe(browserSync.stream())
		// Сообщение об успехе
		.pipe(notify({
			message: "scripts complete"
		}));
});

// Таск отчистки папки с картинками
gulp.task('clean:images', function() {
	return gulp.src(paths.build.images, {
			read: false
		})
		.pipe(clean());
});

// Таск запускает оптимизацию картинок
gulp.task('optim:images', function() {
	return gulp.src(paths.static.images)
		.pipe(imagemin({
			progressive: true,
			use: [pngquant()]
		}))
		.pipe(gulp.dest(paths.build.images));
});

// Таск отчистки папки с шрифтами
gulp.task('clean:fonts', function() {
	return gulp.src(paths.build.fonts, {
			read: false
		})
		.pipe(clean());
});

// Таск копирует новые шрифты
gulp.task('copy:fonts', function() {
	return gulp.src(paths.static.fonts)
		.pipe(gulp.dest(paths.build.fonts));
});

// Таск отчистки папки с контентом
gulp.task('clean:content', function() {
	return gulp.src(paths.build.content, {
			read: false
		})
		.pipe(clean());
});

// Таск копирует новый контент
gulp.task('copy:content', function() {
	return gulp.src(paths.static.content)
		.pipe(gulp.dest(paths.build.content));
});

// Таск отчистки папки с фавиконами
gulp.task('clean:favicons', function() {
	return gulp.src(paths.build.favicons, {
			read: false
		})
		.pipe(clean());
});

// Таск копирует новые фавиконы
gulp.task('copy:favicons', function() {
	return gulp.src(paths.static.favicons)
		.pipe(gulp.dest(paths.build.favicons));
});

// Таск слежки за файлами
gulp.task('watch', function(cb) {
	gulp.parallel(
		'serve'
	)(cb);

	// Следим за symbol svg
	gulp.watch(paths.static.svg.symbol, gulp.series('svg-symbol'));

	// следим за background svg
	gulp.watch(paths.static.svg.background, gulp.series('svg-background'));

	// Следим за pug файлами
	gulp.watch(paths.pug.pugDir + '**/*.pug', gulp.series('pug-compile', 'pug-reload'));

	// Следим за json данными
	gulp.watch(paths.json.data, gulp.series('json', 'pug-compile', 'pug-reload'));

	// Следим за стилями
	gulp.watch(paths.scss.styleDir + '**/*.scss', gulp.series('style'));

	// Следим за библиотеками скриптов
	gulp.watch(paths.js.libs + '*.min.js', gulp.series('libs'));

	// Следим за скриптами
	gulp.watch(paths.js.scripts + '*.js', gulp.series('scripts'));

	// Следим за картинками
	gulp.watch(paths.static.images, gulp.series('clean:images', 'optim:images'));

	// Следим за картинками в контенте
	gulp.watch(paths.static.content, gulp.series('clean:content', 'copy:content'));

	// Следим за шрифтами
	gulp.watch(paths.static.fonts, gulp.series('clean:fonts', 'copy:fonts'));

	// Следим за favicons
	gulp.watch(paths.static.favicons, gulp.series('clean:favicons', 'copy:favicons'));

	// protip: stop old version of gulp watch from running when you modify the gulpfile
	gulp.watch('gulpfile.js').on('change', () => process.exit(0));
});

gulp.task('default', gulp.series(
	// Сначала собирем стили svg потом только все остальные стили
	'svg-symbol', 'svg-background',	'style',
	// Сначала собрем json данные, потом только компилируем pug
	'json',	'pug-compile',
	// Собираем скрипты
	'libs', 'scripts',
	// Копируем все статические элементы
	'optim:images', 'copy:fonts', 'copy:content', 'copy:favicons',
	// Начинаем слежку
	'watch'
));

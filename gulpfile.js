// сборка для продакшена
"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var sourcemaps = require("gulp-sourcemaps");

var csscomb = require("gulp-csscomb");
var csslint = require("gulp-csslint");

var server = require("browser-sync").create();
var rename = require("gulp-rename");

var pump = require("pump");
var uglify = require("gulp-uglify");
var concat = require("gulp-concat");

var htmlmin = require("gulp-htmlmin")
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");

var minify = require("gulp-csso");
var imagemin = require("gulp-imagemin");
var imageminJpegRecompress = require("imagemin-jpeg-recompress");
var pngquant = require("imagemin-pngquant");
var cache = require("gulp-cache");
var webp = require("gulp-webp");
var svgstore = require("gulp-svgstore");
var svgmin = require("gulp-svgmin");

var changed = require("gulp-changed");
var run = require("run-sequence");
var del = require("del");

var ghpages = require("gh-pages");

// var onError = function (err) {
// console.log(err);
// };

gulp.task("compress", function (cb) {
  pump([
    gulp.src("source/js/**/*.js"),
    sourcemaps.init(),
    uglify(),
    rename({suffix: ".min"}),
    sourcemaps.write(),
    gulp.dest("build/js")
    ], cb);
});

gulp.task("concat", ["compress"], function (cb) {
  pump([
    gulp.src(["source/js/dropdown-menu.js","source/js/map.js"]),
    sourcemaps.init(),
    uglify(),
    concat("main.min.js"),
    sourcemaps.write(),
    gulp.dest("build/js")
  ], cb);
});

gulp.task("style", function() {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(sourcemaps.write({includeContent: false}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest("build/css"))
    .pipe(minify())
    .pipe(rename("style.min.css"))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

gulp.task("csscomb", function () {
  return gulp.src("build/css/**/*.css")
    .pipe(csscomb("build/csscomb.json"))
    .pipe(gulp.dest("build/css"));
});

gulp.task("serve", function () {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", ["style"]);
  gulp.watch("source/*.html", ["html"]).on("change", server.reload);
  gulp.watch("source/js/*.js", ["concat"]).on("change", server.reload);
});

// gulp.task("watch", function() {
//   gulp.watch("source/sass/**/*.{scss,sass}", ["style"]).on("change", server.reload);
//   gulp.watch("source/js/**/*.js").on("change", server.reload);
//   gulp.watch("source/*.html", ["html"]).on("change", server.reload);
// });

gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(posthtml([
      include()
    ]))
    .pipe(htmlmin({
      minifyJS: true,
      minifyURLs: true,
      collapseWhitespace: false,
      removeComments: true,
      sortAttributes: true,
      sortClassName: true
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("build"));
});

// Images optimization and copy in /build
gulp.task("images", function() {
  return gulp.src("source/img/**/*.*")
    .pipe(cache(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imageminJpegRecompress({
        loops: 5,
        min: 65,
        max: 70,
        quality:"medium"
      }),
      imagemin.svgo(),
      imagemin.optipng({optimizationLevel: 3}),
      pngquant({quality: "65-70", speed: 5})
    ],{
      verbose: true
    })))
    .pipe(gulp.dest("source/img/min"));
});

gulp.task("del-images", function () {
  return del("source/img/min");
});

gulp.task("minimg", function (done) {
  run(
    "del-images",
    "images",
    done);
});

// Clearing the cache
gulp.task("clearcache", function (done) {
  return cache.clearAll(done);
});

gulp.task("oldimages", function () {
  return gulp.src("source/img/raster/*.{jpg,png}")
    .pipe(changed("source/img/min/raster"))
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img/raster"));
});

gulp.task("webp", function () {
  return gulp.src("source/img/raster/*.{jpg,png}")
    .pipe(webp({quality: 85}))
    .pipe(gulp.dest("build/img/webp"));
});

gulp.task("copy-images", function() {
  return gulp.src([
    "source/img/min/**/*.*"
    ], {
      base: "source/img/min"
    })
      .pipe(gulp.dest("build/img"))
    //return del("build/img/min/");
});

gulp.task("svg", function () {
  return gulp.src("source/img/vector/**/*.svg")
    .pipe(svgmin())
    .pipe(gulp.dest("build/img/vector"));
});

gulp.task("sprite", ["svg"], function () {
  return gulp.src("build/img/vector/sprite/*.svg")
    .pipe(svgstore({
      inlineSvg: true
      }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img/vector"));
});

gulp.task("del-sprite", function () {
  return del("build/img/vector/sprite{.svg,/}");
});

gulp.task("copy", function () {
  return gulp.src([
      "source/fonts/**/*.{woff,woff2}"
      //"source/img/**",
      //"source/js/**/*.js"
    ], {
      base: "source"
    })
    .pipe(gulp.dest("build"));
});

gulp.task("cpcomb", function () {
  return gulp.src([
      "./csscomb.json"], {
        base: "./"
      })
  .pipe(gulp.dest("build"));
});

gulp.task("clean", function () {
  return del("build");
});

gulp.task("build", function (done) {
  run(
    //"del-images" - удаляем исходную папку со сжатыми img - идет отдельно, первым (альтернатива - minimg)
    //"images" - заново сжимаем все img - идет отдельно, вторым (альтернатива - minimg)
    "clean",
    "clearcache",
    "copy",
    //"cpcomb",
    "copy-images",
    "webp",
    "sprite",
    "style",
    //"csscomb",// - запускается отдельно, при желании
    "html",
    "concat",
    done);
});

ghpages.publish("build", {
  message: "UpDated at " + new Date()
});

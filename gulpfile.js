var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var minify = require("gulp-csso");
var rename = require("gulp-rename");
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var server = require("browser-sync").create();

gulp.task("sass", function () {
  gulp.src("sass/style.scss")
    .pipe(plumber())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest("css"))
    .pipe(minify())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("css"))
    .pipe(server.stream());
});

gulp.task("serve", ["sass"], () => {
  server.init({
    server: {
      baseDir: ".",
      index: "form.html"
    },
    // server: ".",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("sass/**/*.{scss,sass}", ["sass"]);
  gulp.watch("*.html").on("change", server.reload);
  gulp.watch("js/**/*.js").on("change", server.reload);
});

gulp.task("images", function () {
  gulp.src("img/**/*.{jpg,png,svg}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("img"));
});

gulp.task("webp", function () {
  gulp.src("img/**/*.{png,jpg}")
  .pipe(webp({quality: 50}))
  .pipe(gulp.dest("img"));
})


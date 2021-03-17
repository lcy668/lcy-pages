const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del')
const loadPlugins = require('gulp-load-plugins')
const browserSync = require('browser-sync')

const plugins = loadPlugins()
const bs = browserSync.create()
const cwd = process.cwd()
let config = {
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}
try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (e) {}
// 编译 sass 文件
const buildStyle = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}
// 编译 script 文件
const buildScript = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}
// 编译 html 文件
const buildPage = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}
// 编译 image 文件
const buildImg = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
// 编译 font 文件
const buildFont = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
// 编译其他文件
const copyExtra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}
// 清除操作
const clean = () => {
  return del([config.build.dist, config.build.temp])
}
// 转化构建注释
const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist))
}
const serve = () => {
  // 监听 style、js、html 文件
  watch(config.build.paths.styles, { cwd: config.build.src }, buildStyle)
  watch(config.build.paths.scripts, { cwd: config.build.src }, buildScript)
  watch(config.build.paths.pages, { cwd: config.build.src }, buildPage)
  // 监听 image, font
  watch([config.build.paths.images, config.build.paths.fonts], { cwd: config.build.src }, bs.reload)
  // 监听额外文件
  watch('**', { cwd: config.build.public }, bs.reload)
  bs.init({
    notify: false,
    port: 2080,
    /* files: 'dist/**', */
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}
// 编译 html、css 、js
const compile = parallel(buildStyle, buildScript, buildPage)
// 发布之前
const build = series(clean, parallel(series(compile, useref), buildImg, buildFont, copyExtra))
// 开发阶段
const develop = series(compile, serve)
module.exports = { clean, build, develop }

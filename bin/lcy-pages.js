#!/usr/bin/env node
// cwd 目录
process.argv.push('--cwd')
process.argv.push(process.cwd())
// gulpfile.js 目录
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..'))
// 运行 CLI 程序
require('gulp/bin/gulp')

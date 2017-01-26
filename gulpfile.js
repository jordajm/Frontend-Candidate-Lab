var gulp = require('gulp');
var glob = require('glob');
var args = require('yargs').argv;
var del = require('del');
var jshint = require('gulp-jshint');
var wiredep = require('wiredep').stream;
var browserSync = require('browser-sync');
var path = require('path');
var config = require('./gulpfile.config')();
var notifier = require('node-notifier');
var plato = require('plato');
var fork = require('child_process').fork;
var karma = require('karma').server;
var _ = require('lodash');
var shell = require('gulp-shell');
var $ = require('gulp-load-plugins')({ lazy: true });

var colors = $.util.colors;
var envenv = $.util.env;
var port = process.env.PORT || config.defaultPort;

/**
 * yargs variables can be passed in to alter the behavior, when present.
 * Example: gulp serve-dev
 *
 * --verbose  : Various tasks will produce more output to the console.
 * --nosync   : Don't launch the browser with browser-sync when serving code.
 * --debug    : Launch debugger with node-inspector.
 * --debug-brk: Launch debugger and break on 1st line with node-inspector.
 * --startServers: Will start servers for midway tests on the test task.
 */

function getNodeOptions(isDev) {
    return {
        script: config.nodeServer,
        ext: 'js html',
        delayTime: 1,
        env: {
            'PORT': port,
            'NODE_ENV': isDev ? 'dev' : 'production'
        },
        watch: config.server
    };
}

/**
 * Log a message or series of messages using chalk's blue color.
 * Can pass in a string, object or array.
 */
function log(msg) {
    if (typeof (msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}

/**
 * Show OS level notification using node-notifier
 */
function notify(options) {
    var notifyOptions = {
        sounds: 'Bottle',
        contentImage: path.join(__dirname, 'gulp.png'),
        icon: path.join(__dirname, 'gulp.png')
    };

    _.assign(notifyOptions, options);
    notifier.notify(notifyOptions);
}

/**
* When files change, log it
* @param  {Object} event - event that fired
*/
function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

/**
 * Start BrowserSync
 * --nosync will avoid browserSync
 */
function startBrowserSync(isDev, specRunner) {
    if (args.nosync || browserSync.active) {
        return;
    }

    log('Starting BrowserSync on port ' + port);

    // If build: watches the files, builds, and restarts browser-sync.
    // If dev: watches sass, compiles it to css, browser-sync handles reload
    if (isDev) {
        gulp.watch([config.paths.allSass, config.paths.adminJs, config.paths.adminTemplates], 
            ['adminTemplatecache','adminStyles', browserSync.reload])
            .on('change', changeEvent);
    } else {
        gulp.watch([config.paths.allSass, config.paths.adminJs, config.paths.adminTemplates],
            ['optimizeAdmin', browserSync.reload])
            .on('change', changeEvent);
    }

    var options = {
        proxy: 'localhost:' + port,
        port: 3300,
        files: isDev ? [
            config.client + '**/*.*',
            '!' + config.sass,
            config.temp + '**/*.css'
        ] : [],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 0 // 1000
    };

    if (specRunner) {
        options.startPath = config.specRunnerFile;
    }

    browserSync(options);
}

/**
* Format a number as a percentage
* @param  {Number} num       Number to format as a percent
* @param  {Number} precision Precision of the decimal
* @return {String}           Formatted perentage
*/
function formatPercent(num, precision) {
    return (num * 100).toFixed(precision);
}

/**
 * Formatter for bytediff to display the size changes after processing
 * @param  {Object} data - byte data
 * @return {String}      Difference in bytes, formatted
 */
function bytediffFormatter(data) {
    var difference = (data.savings > 0) ? ' smaller.' : ' larger.';
    return data.fileName + ' went from ' +
        (data.startSize / 1000).toFixed(2) + ' kB to ' +
        (data.endSize / 1000).toFixed(2) + ' kB and is ' +
        formatPercent(1 - data.percent, 2) + '%' + difference;
}

/**
 * Delete all files in a given path
 * @param  {Array}   path - array of paths to delete
 * @param  {Function} done - callback when complete
 */
function clean(path, done) {
    log('Cleaning: ' + $.util.colors.blue(path));
    del(path, done);
}

/**
 * Format and return the header for files
 * @return {String}           Formatted file header
 */
function getHeader() {
    var pkg = require('./package.json');
    var template = ['/**',
        ' * <%= pkg.name %> - <%= pkg.description %>',
        // ' * @authors <%= pkg.authors %>',
        ' * @version v<%= pkg.version %>',
        // ' * @link <%= pkg.homepage %>',
        // ' * @license <%= pkg.license %>',
        ' */',
        ''
    ].join('\n');
    return $.header(template, {
        pkg: pkg
    });
}

/**
* Order a stream
* @param   {Stream} src   The gulp.src stream
* @param   {Array} order Glob array pattern
* @returns {Stream} The ordered stream
*/
function orderSrc(src, order) {
    return gulp.src(src)
        .pipe($.if(order, $.order(order)));
}

/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} src   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Array} order   glob pattern for sort order of the files
 * @returns {Stream}   The stream
 */
function inject(src, label, order) {
    var options = { read: false };
    if (label) {
        options.name = 'inject:' + label;
    }

    return $.inject(orderSrc(src, order), options);
}

/**
 * serve the code
 * --debug-brk or --debug
 * --nosync
 * @param  {Boolean} isDev - dev or build mode
 * @param  {Boolean} specRunner - server spec runner html
 */
function serve(isDev, specRunner) {
    var debugMode = '--debug';
    var nodeOptions = getNodeOptions(isDev);

    nodeOptions.nodeArgs = [debugMode + '=5858'];

    if (args.verbose) {
        console.log(nodeOptions);
    }

    return $.nodemon(nodeOptions)
        .on('restart', ['vet'], function (ev) {
            log('*** nodemon restarted');
            log('files change:\n' + ev);
            setTimeout(function () {
                browserSync.notify('reloading now ...');
                browserSync.reload({ stream: false });
            }, config.browserReloadDelay);
        })
        .on('start', function () {
            log('*** nodemon started');
            startBrowserSync(isDev, specRunner);
        })
        .on('crash', function () {
            log('*** nodemon crashed: script crashed for some reason');
        })
        .on('exit', function () {
            log('*** nodemon exited cleanly');
        });
}

/**
 * Start Plato inspector and visualizer
 */
function startPlatoVisualizer(done) {
    log('Running Plato');

    var files = glob.sync(config.plato.js);

    var options = {
        title: config.plato.title,
        exclude: config.plato.excludeFiles
    };

    var outputDir = config.report + '/plato';

    function platoCompleted(report) {
        var overview = plato.getOverviewReport(report);
        if (args.verbose) {
            log(overview.summary);
        }

        if (done) {
            done();
        }
    }

    plato.inspect(files, outputDir, options, platoCompleted);
}

/**
 * Start the tests using karma.
 * @param {boolean} singleRun - True means run once and end (CI), or keep running (dev)
 * @param {Function} done - Callback to fire when karma is done
 * @return {undefined}
 */
function startTests(singleRun, done) {
    var child;
    var excludeFiles = [];
    var serverSpecs = config.serverIntegrationSpecs;

    if (args.startServers) {
        log('Starting servers');
        var savedEnv = process.env;
        savedEnv.NODE_ENV = 'dev';
        savedEnv.PORT = 8888;
        child = fork(config.nodeServer);
    } else {
        if (serverSpecs && serverSpecs.length) {
            excludeFiles = serverSpecs;
        }
    }

    function karmaCompleted(karmaResult) {
        log('Karma completed');

        if (child) {
            log('Shutting down the child process');
            child.kill();
        }

        if (karmaResult === 1) {
            done('Karma: tests failed with code ' + karmaResult);
        } else {
            done();
        }
    }

    karma.start({
        configFile: __dirname + '/karma.conf.js',
        exculde: excludeFiles,
        singleRun: !!singleRun
    }, karmaCompleted);
}

/**
* List the available gulp tasks
*/
gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

/**
 * vet the code and create coverage report
 * @return {Stream}
 */
gulp.task('vet', function () {
    log('Analyzing source with JSHint and JSCS');

    return gulp.src(config.allJs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', { verbose: true }))
        .pipe($.jshint.reporter('fail'))
        .pipe($.jscs());
});

/**
 * Create a visualizer report
 */
gulp.task('plato', function (done) {
    log('Analyzing source with Plato');
    log('Browse to /report/plato/index.html to see Plato results');

    startPlatoVisualizer(done);
});

/**
 * Run specs once and exit
 * To start servers and run midway sepcs as well:
 *     gulp test --startServers
 * @return {Stream}
 */
gulp.task('test', ['vet', 'templatecache'], function (done) {
    startTests(true /*singleRun*/, done);
});

/**
 * Run specs and wait
 * Watch for file changes and re-run tests on each change
 * To start servers and run midway specs as well:
 *    gulp autotest --startServers
 */
gulp.task('autotest', function (done) {
    startTests(false /*singleRun*/, done);
});

/**
 * Inject all the spec files into the specs.html
 * @return {Stream}
 */
gulp.task('build-specs', ['templatecache'], function (done) {
    log('Building the spec runner');

    var templateCache = config.temp + config.templateCache.file;
    var options = config.getWiredepDefaultOptions();
    var specs = config.specs;

    if (args.startServers) {
        specs = [].concat(specs, config.serverIntegrationSpecs);
    }

    options.devDependencies = true;

    return gulp.src(config.specRunner)
        .pipe(wiredep(options))
        .pipe(inject(config.paths.js, '', config.jsOrder))
        .pipe(inject(config.testLibraries, 'testlibraries'))
        .pipe(inject(config.specHelpers, 'spechelpers'))
        .pipe(inject(specs, 'specs', ['**/*']))
        .pipe(inject(templateCache, 'templates'))
        .pipe(gulp.dest(config.paths.client));
});

/**
 * Build everything
 * This is separate so we can run tests on
 * optimize before handling image or fonts
 */
gulp.task('build', ['clean-adminBuild', 'optimizeAdmin'], function () {
    process.env['NODE_ENV'] = 'production';

    gulp.src(config.paths.materialIcons)
        .pipe($.copy('./adminBuild'));

    gulp.src(config.paths.fontAwesome)
        .pipe($.copy('./adminBuild', { prefix: 4 }));
        
    gulp.src(config.paths.images)
        .pipe($.copy('./adminBuild'))

    log('Build Complete')
    notify('Buid Complete');

});

gulp.task('optimizeAdmin', [], function () {
    log('Optimizing the Admin js, css, and html');

    var revAll = new $.revAll({ 
        prefix: 'https://ddbwc4cmxx1p2.cloudfront.net',
        dontSearchFile: [ 'lib.js' ] 
    });

    var stream = gulp.src(config.paths.adminIndex)
        .pipe($.plumber())
        .pipe($.useref({ searchPath: './' }))
        .pipe($.if('*.js', $.uglify({ mangle: false })))
        .pipe($.if('*.css', $.minifyCss()))
        .pipe($.if('*.js', getHeader()))
        .pipe($.if('*.css', getHeader()))
        .pipe(revAll.revision())
        .pipe(gulp.dest(config.adminBuildPaths.root));

    return stream;

});

gulp.task('publish', function() {

    var publisher = $.awspublish.create(config.aws);
    var headers = {'Cache-Control': 'max-age=315360000, no-transform, public'};

    gulp.src('./adminBuild/**')
        .pipe($.awspublish.gzip())
        .pipe(publisher.publish(headers))
        .pipe(publisher.cache())
        .pipe($.awspublish.reporter());
        // .pipe($.cloudfront(config.cloudfront));
});

/**
 * Bump the version
 * --type=pre will bump the prerelease version *.*.*-x
 * --type=patch or no flag will bump the patch version *.*.x
 * --type=minor will bump the minor version *.x.*
 * --type=major will bump the major version x.*.*
 * --ver=1.2.3 will bump to a specific version and ignore other flags
 */
gulp.task('bump', function () {
    var msg = 'Bumping versions';
    var type = args.type;
    var version = args.version;
    var options = {};
    if (version) {
        options.version = version;
        msg += ' to ' + version;
    } else {
        options.type = type;
        msg += ' for a ' + type;
    }
    log(msg);

    return gulp
        .src(config.packages)
        .pipe($.print())
        .pipe($.bump(options))
        .pipe(gulp.dest(config.root));
});

/**
 * Compile sass to css
 * @return {Stream}
 */
gulp.task('adminStyles', ['clean-styles'], function () {
    log('Compiling Admin Sass --> CSS');

    return gulp.src(config.paths.adminSass)
        .pipe($.plumber()) // exit gracefully if something fails after this
        .pipe($.sass().on('error', $.sass.logError))
        .pipe($.autoprefixer({ browsers: ['last 2 version', '> 5%'] }))
        .pipe(gulp.dest(config.adminTemp + 'styles'));
});

/**
 * copy fonts
 * @return {stream}
 */
gulp.task('fonts', ['clean-fonts'], function () {
    log('Copying fonts');

    return gulp.src(config.paths.fonts)
        .pipe(gulp.dest(config.buildPaths.fonts));
});

/**
 * compress images
 * @return {stream}
 */
gulp.task('images', ['clean-images'], function () {
    log('Compressing and copying images');

    return gulp.src(config.paths.images)
        .pipe($.imagemin({ optimizationLevel: config.optimized.level }))
        .pipe(gulp.dest(config.buildPaths.images));
});

/**
 * Create $templateCache from the html templates
 * @return {Stream}
 */
gulp.task('adminTemplatecache', ['clean-code'], function () {
    log('Creating an AngularJS $templateCache for Admin app');

    return gulp.src(config.paths.adminTemplates)
        .pipe($.if(args.verbose, $.bytediff.start()))
        .pipe($.minifyHtml({ empty: true }))
        .pipe($.if(args.verbose, $.bytediff.stop(bytediffFormatter)))
        .pipe($.angularTemplatecache(config.adminTemplateCache.file, config.adminTemplateCache.options))
        .pipe(gulp.dest(config.adminTemp));
});

/**
 * Wire-up the bower dependencies
 * @return {Stream}
 */
gulp.task('wiredepAdmin', function () {
    log('Wiring the Admin bower dependencies into the html');
    var options = config.getWiredepDefaultOptions();

    var js = args.stubs ? [].concat(config.paths.adminJs) : config.paths.adminJs;

    return gulp.src(config.paths.adminIndex)
        .pipe(wiredep(options))
        .pipe(inject(js, '', config.jsOrder))
        .pipe(gulp.dest('./views'));
});

// Inject front-end dependencies for the Admin app
gulp.task('injectAdmin', ['wiredepAdmin', 'adminStyles', 'adminTemplatecache'], function () {
    log('Wire up Admin css into the html, after files are ready');

    return gulp.src(config.paths.adminIndex)
        .pipe(inject(config.adminCss))
        .pipe(inject(config.adminTemplateCacheLocation, 'templates'))
        .pipe(gulp.dest('./views'));
});

/**
 * Remove all files from the build, temp, and reports folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean', function (done) {
    var delconfig = [].concat(config.adminBuildPaths.root, config.adminTemp, config.report);
    clean(delconfig, done);
});

/**
 * Remove all styles from the build and temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-styles', function (done) {
    var files = [].concat(
        config.adminTemp + '**/*.css',
        config.adminBuildPaths.root + '/styles/**/*.css'
    );
    clean(files, done);
});

/**
 * Remove all js and html from the build and temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-code', function (done) {
    var files = [].concat(
        config.adminTemp + '**/*.js',
        config.adminBuildPaths.root + '/**/*.js',
        config.adminBuildPaths.root + '/**/*.html'
        );
    clean(files, done);
});

/**
 * remove all fonts from the build folder
 * @param {Function} done - callback when complete
 */
gulp.task('clean-fonts', function (done) {
    clean(config.buildPaths.fonts, done);
});

/**
 * remove all images from the build folder
 */
gulp.task('clean-images', function (done) {
    clean(config.buildPaths.images, done);
});

/**
 * remove all files from admin build folder
 */
gulp.task('clean-adminBuild', function () {
    return gulp.src(config.adminBuildPaths.root, {read: false})
        .pipe($.clean());
    // return $.clean(config.adminBuildPaths.root);
});

/**
 * serve the dev environment
 * --debug-brk or --debug
 * --nosync
 */
gulp.task('serve-dev', ['injectAdmin'], function () {
    process.env['NODE_ENV'] = 'dev';
    serve(true /*isDev*/);
});

/**
 * serve the build environment
 * --debug-brk or --debug
 * --nosync
 */
// gulp.task('serve-build', ['build'], function () {
//     process.env['NODE_ENV'] = 'production';
//     serve(false /*isDev*/);
// });

gulp.task('serve-specs', ['build-specs'], function (done) {
    log('Run the spec runner');

    serve(true /* isDev */, true /* specRunner */);
    done();
});

module.exports = gulp;

module.exports = function () {
    var wiredep = require('wiredep');
    var bowerFiles = wiredep({devDependencies: true}).js;

    var paths = {
        client: './src/client',
        adminJs: [
            './src/client/admin/*.js',
            './src/client/admin/**/*.js',
            './src/client/admin/**/**/*.js'
        ],
        displayJs: [
            './src/client/display/*.js',
            './src/client/display/**/*.js',
            './src/client/display/**/**/*.js'
        ],
        adminSass: './src/client/admin/styles/styles.scss',
        displaySass: './src/client/display/styles/styles.scss',
        adminSassPaths: [
            './src/client/admin/components/wrapper'
        ],
        displaySassPaths: [
            './src/client/display/components/display/'
        ],
        allSass: './src/client/**/**/**/*.scss',
        images: './img/*',
        fonts: './src/client/fonts/**/*',
        html: './src/client/**/*.html',
        adminTemplates: [
            './src/client/admin/components/**/*.html',
            './src/client/admin/components/**/**/*.html'
        ],
        displayTemplates: [
            './src/client/display/components/**/*.html',
            './src/client/display/components/**/**/*.html'
        ],
        adminIndex: './views/admin.html',
        displayIndex: './views/display.html',
        materialIcons: [
            './material-icons/MaterialIcons-Regular.eot',
            './material-icons/MaterialIcons-Regular.ttf',
            './material-icons/MaterialIcons-Regular.woff',
            './material-icons/MaterialIcons-Regular.woff2'
        ],
        fontAwesome: './src/client/libs/font-awesome/fonts/*.*'
    };

    var adminBuildPaths = {
        root: './adminBuild',
        js: './adminBuild/app',
        styles: './adminBuild/styles',
        fonts: './adminBuild/fonts',
        images: './adminBuild/images',
        libs: './adminBuild/libs'
    };

    var displayBuildPaths = {
        root: './displayBuild/display',
        js: './displayBuild/app',
        styles: './displayBuild/styles',
        fonts: './displayBuild/fonts',
        images: './displayBuild/images',
        libs: './displayBuild/libs'
    };

    var bower = {
        bowerJson: require('./bower.json'),
        directory: './src/client/libs',
        fileTypes: {
            html: {
                replace: {
                    js: '<script src="{{filePath}}"></script>'
                }
            }
        }
    };

    var adminTemplateCache = {
        file: 'templates.js',
        options: {
            module: 'admin',
            root: 'admin/',
            standAlone: false
        }
    };

    var displayTemplateCache = {
        file: 'templates.js',
        options: {
            module: 'display',
            root: 'display/',
            standAlone: false
        }
    };

    var optimized = {
        app: 'app.js',
        lib: 'lib.js',
        level: 4
    };

    var jsOrder = [
        '**/app.module.js',
        '**/*.module.js',
        '**/*.js'
    ];

    var plato = {
        title: 'Plato Inspections Report',
        js: './src/client/app/**/*.js',
        excludeFiles: /.*\.spec\.js/
    };

    var testLibraries = [
        'node_modules/mocha/mocha.js',
        'node_modules/chai/chai.js',
        'node_modules/sinon-chai/lib/sinon-chai.js',
        'node_modules/sinon/lib/sinon.js'
    ];

    var specHelpers = [
        './src/client/test-helpers/*.js'
    ];

    var specs = [
        './src/client/app/**/*.spec.js'
    ];

    var packages = [
        './package.json',
        './bower.json'
    ];

    var server = [
        '/app.js',
        '/schema/*.js',
        '/views/**/*.js',
        '/views/**/**/*.js',
        '/views/**/*.html',
        '/views/**/**/*.html',
        '/models.js',
        '/routes.js',
        '/config.js'
    ];

    var aws = {
        "params": {
            "Bucket": "conduit-static-web"
        },
        "patternIndex": /admin\.[a-z0-9]{8}\.html(\.gz)*$/gi,
        "accessKeyId": "AKIAJEKCNYCSIKYEZH4Q", 
        "secretAccessKey": "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",
        "distributionId": "E359F47ED60EIF",
        "region": "us-east-1"
    };

    var cloudfront = {
        "key": "AKIAJEKCNYCSIKYEZH4Q",
        "secret": "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",
        "bucket": "conduit-static-web",
        "region": "us-east-1",
        "distributionId": "E359F47ED60EIF",
        "patternIndex": /admin\.[a-z0-9]{8}\.html(\.gz)*$/gi
    }

    var config = {
        allJs: [
            './src/**/*.js',
            './*.js',
            '!./src/client/libs/**/*.js'
        ],
        paths: paths,
        adminBuildPaths: adminBuildPaths,
        displayBuildPaths: displayBuildPaths,
        bower: bower,
        defaultPort: '8001',
        server: server,
        client: './src/client',
        source: './src',
        adminTemp: './.adminTmp/',
        displayTemp: './.displayTmp/',
        nodeServer: './app.js',
        browserReloadDelay: 1000,
        report: './report/',
        adminCss: './.adminTmp/styles/styles.css',
        displayCss: './.displayTmp/styles/styles.css',
        adminTemplateCache: adminTemplateCache,
        adminTemplateCacheLocation: './.adminTmp/templates.js',
        displayTemplateCache: displayTemplateCache,
        displayTemplateCacheLocation: './.displayTmp/templates.js',
        optimized: optimized,
        root: './',
        jsOrder: jsOrder,
        plato: plato,
        specRunner: './src/client/specs.html',
        specRunnerFile: 'specs.html',
        testLibraries: testLibraries,
        specHelpers: specHelpers,
        specs: specs,
        packages: packages,
        aws: aws,
        cloudfront: cloudfront
    };

    config.getWiredepDefaultOptions = function () {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            fileTypes: config.bower.fileTypes,
            ignorePath: '..'
        };

        return options;
    };

    // function getKarmaOptions() {
    //     var options = {
    //         files: [].concat(
    //             bowerFiles,
    //             config.specHelpers,
    //             './src/client/app/**/*.module.js',
    //             './src/client/app/**/*.js',
    //             temp + config.templateCache.file
    //         ),
    //         exclude: [],
    //         coverage: {
    //             dir: config.report + 'coverage',
    //             reporters: [
    //                 // reporters not supporting the `file` property
    //                 {type: 'html', subdir: 'report-html'},
    //                 {type: 'lcov', subdir: 'report-lcov'},
    //                 {type: 'text-summary'} //, subdir: '.', file; 'text-summary.text}
    //             ]
    //         },
    //         preprocessors: {}
    //     };

    //     options.preprocessors['./src/client/app/**/!(*.spec)+(.js)'] = ['coverage'];

    //     return options;
    // }

    // config.karma = getKarmaOptions();

    return config;
};

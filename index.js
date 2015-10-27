/**
 * gulp-from-config
 * @author kystkysto
 * @copyright kystkysto 2015
 */

// Root path
var rootPath = process.cwd(),

// Npm modules
    path = require('path'),
    glob = require('glob'),
	browserify = require('browserify'),
    watchify = require('watchify'),
    fileExists = require('file-exists'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),

// Gulp plugins
    gutil = require('gulp-util');

/**
 * Define and return tasks
 * @access public
 * @param {Object} gulp - instanse of gulp
 * @param {Object} gulpPlugins - instance of gulp-load-plugins
 * @returns {Array} tasks
 */
var createTasks = function createTasks(gulpInstance) {

    // Gulp
    var gulp = gulpInstance,

    // Main config
        mainConfig = this.__config,

    // Path og config files
        configsPath = mainConfig ? mainConfig.paths.config : path.join(rootPath, 'configs');

    /**
     * Create gulp tasks
     * @access private
     * @returns {Array} tasks
     */
    function addTasks() {

        var configs = getConfigs.call(this),
            tasks = [],
            subTasks;

        configs.forEach(function (config) {

            var taskName = config.name;

            if(taskName) {

                subTasks = createTask.call(this, config);

                gulp.task(taskName, subTasks, function(){});

                tasks.push(taskName);

            } else {
                gutil.log(gutil.colors.red('Error:'), 'task name must be set');
            }
        }.bind(this));

        return tasks;
    }

    /**
     * Create task procedures
     * @access private
     * @param {Object} config
     * @returns {Array}
     */
    function createTask(config) {

        var subTasks = [],
            subTaskName = '',
            subTaskWatch = '';

        if(Array.isArray(config.subTasks) && config.subTasks.length) {

            config.subTasks.forEach(function (subTask) {

                if (!subTask.name) {
                    subTask.name = randomTaskName();
                }

                subTaskName = config.name + ':' + subTask.name;
                subTaskWatch = config.name + ':watch:' + subTask.name;

                if (isSubTaskValid(subTask)) {

                    subTasks.push(subTaskName);
                    if (typeof subTask.watch !== "undefined") {

                        setWatch(subTaskName, subTaskWatch, subTask);

                        subTasks.push(subTaskWatch);
                    }

                    createSubTask.call(this, subTaskName, subTask, config.name);
                }
            }.bind(this));
        } else {

            gutil.log(gutil.colors.yellow('Warning:'), 'subTasks are not set');
        }

        return subTasks;
    }

    /**
     * Check if subtask is valid
     * @access private
     * @param {Object} task
     * @returns {boolean}
     */
    function isSubTaskValid(task) {

        if (Object.keys(task.src).length &&
            Array.isArray(task.src.include) &&
            task.src.include.length &&
            typeof(task.dest) === 'string') {

            return true;
        } else {

            gutil.log(gutil.colors.red('Error:'),
                'src and dest must be set for',
                gutil.colors.cyan(subTaskName));

            return false;
        }
    }

    /**
     * Cretate sub tasks of task
     * @access private
     * @param {string} subTaskName
     * @param {Object} subTask
     */
    function createSubTask(subTaskName, subTask, taskName) {

        var taskCompletion = this.__taskCompletion;

        gulp.task(subTaskName, function (taskCompletion) {

            var task = {},
                dest = rootPath + subTask.dest;

                if(subTask.browserify) {
                    task = setBrowserify(subTask.src, subTask.browserify, taskName);
                } else {
                    task = setSrc(subTask.src);
                }

            task = setPipes(task, subTask.plugins, subTask.sourcemaps);

            task = task.pipe(gulp.dest(dest));

            taskCompletion(subTask);

            return task;
        }.bind(this, taskCompletion));
    }

	/**
     * Prepare source patshs
     * @access private
     * @param {Object} srcPaths
     * @returns Array
	 */
	function prepareSrc(srcPaths) {
		
        var src = [],
            include = [];

        if(Object.keys(srcPaths).length) {

            include = setFullPaths(srcPaths.include);

            src = src.concat(include);

            if(Array.isArray(srcPaths.exclude) && srcPaths.exclude.length) {

                srcPaths.exclude.forEach(function (path) {

                    src.push('!' + rootPath + path);
                });
            }
        }

        src.forEach(function(srcPath, i) {
            srcPath = minimizePath(srcPath);
            gutil.log('Src path' + i + ':', gutil.colors.magenta(srcPath));
        });
		
		return src;
	}

    /**
     * Cut rootPath from path
     * @access private
     * @param {string} path
     * @returns {string} path
     */
    function minimizePath(path) {
        return path.replace(rootPath, '.');
    }
	
    /**
     * Set source paths
     * @access private
     * @param {Object} srcPaths
     * @returns {*}
     */
    function setSrc(srcPaths) {

        var src = prepareSrc(srcPaths);

        return gulp.src(src);
    }
	
    /**
     * Set browserify
     * @access private
     * @param {Object} srcPaths
     * @param {Object} browserify
     * @param {string} taskName
     * @returns {*}
     */
	function setBrowserify(srcPaths, browserifyConfig, taskName) {
		
		var src = prepareSrc(srcPaths),
            file = browserifyConfig.file || taskName + '.js',
            entries = [],
            b = null;
		
		if(src.length) {

            gutil.log('Browserify enabled:', gutil.colors.blue(true));

            src.forEach(function(e) {
                entries = entries.concat(glob.sync(e));
            });

            b = watchify(browserify({
                entries: entries,
                debug: true
            }));

            b.on('update', function() {

                gulp.start(taskName);
                console.log('updated');
            });
            b = b.on('error', gutil.log.bind(gutil, gutil.colors.red('Error:'),'Browserify Error'));
            b = setTransforms(b, browserifyConfig.transform);
            b = b.bundle();
            b = b.pipe(source(file));
            b = b.pipe(buffer());
		}

		return b;
	}
	
	/**
     * Set browserify transforms
     * @access private
     * @param {Object} b
     * @param {Array} transform
     * @returns {*}
     */
	function setTransforms(b, transforms) {

        var transform = requireTransforms(transforms);

        if(transform.length) {

            b = b.transform(transform);
        }

		return b;
	}

    /**
     * Require transform modules
     * @param transform
     * @returns {Array}
     */
    function requireTransforms(transform) {

        var transfoms = [];

        if(Array.isArray(transform) && transform.length) {

            transform.forEach(function(t) {

                try {
                    var trans = require(t);
                    gutil.log('Transform:',  gutil.colors.green(t));
                    transfoms.push(trans);
                } catch (err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        gutil.log(gutil.colors.red('Error:'), 'Transform does not exist', gutil.colors.green(t));
                    }
                }
            });
        }

        return transfoms;
    }

    /**
     * Set watch task for subtask if enabled
     * @access private
     * @param {string} subTaskName
     * @param {string} subTaskWatch
     * @param {Object} subTask
     */
    function setWatch(subTaskName, subTaskWatch, subTask) {

        var watch = [],
            task = {};

        watch = setWatchPaths(subTask);

        gulp.task(subTaskWatch, function() {

            watch.forEach(function(watchPath, i) {
                watchPath = minimizePath(watchPath);
                gutil.log('Watching path' + i + ':', gutil.colors.magenta(watchPath));
            });

            task = gulp.watch(watch, [subTaskName])

                .on('change', function(event) {
                    gutil.log('File: ' + gutil.colors.magenta(event.path) + ' was ' + gutil.colors.green(event.type));
                });

            return task;
        });
    }

    /**
     * Set watch paths
     * @access private
     * @param {Object} subTask
     * @returns {Array}
     */
    function setWatchPaths(subTask) {

        var watch = [],
            include = [],
            exclude = [];

        if(Array.isArray(subTask.watch) && subTask.watch.length) {

            watch = watch.concat(setFullPaths(subTask.watch));
        } else if(subTask.watch === true) {

            include = setFullPaths(subTask.src.include);
            exclude = setFullPaths(subTask.src.exclude);

            watch = watch.concat(include, exclude);
        } else {

            
        }

        return watch;
    }

    /**
     * Set absoulute paths
     * @access private
     * @param {Array} src
     * @returns {Array}
     */
    function setFullPaths(src) {

        var paths = [];


        if(src instanceof Array) {

            src.forEach(function (path) {

                paths.push(rootPath + path);
            });
        }

        return paths;
    }

    /**
     * Set pipes
     * @access private
     * @param {Object} task
     * @param {bolean} sourcemaps
     * @param {Array} plugins
     * @returns {*}
     */
    function setPipes(task, plugins, sourcemaps) {

        if(Object.keys(task).length) {

            if(Array.isArray(plugins) && plugins.length) {

                gutil.log('Sourcemap enabled:', gutil.colors.blue(sourcemaps));

                task = setSourceMaps(task, sourcemaps, plugins, setPlugins);
            } else {
                gutil.log(gutil.colors.yellow('Warning:'), 'no plugins');
            }
        }

        return task;
    }

    /**
     * Set sourcemaps for proceded files
     * @access private
     * @param {Object} task
     * @param {bolean} sourcemaps
     * @param {Array} plugins
     * @param {Function} setPlugins - callback for plugins
     * @returns {*}
     */
    function setSourceMaps(task, sourcemaps, plugins, setPlugins) {

        var pipe = null;

        if(sourcemaps) {
            pipe = pluginExist('gulp-sourcemaps');
        }

        if(pipe) {
            task = task.pipe(pipe.init({loadMaps: true}));
        }

        task = setPlugins(task, plugins);

        if(pipe) {
            task = task.pipe(pipe.write('./maps'));
        }

        return task;
    }

    /**
     * Set plugins into task pipes
     * @access private
     * @param {Object} task
     * @param {Array} plugins
     * @returns {*}
     */
    function setPlugins(task, plugins) {

        plugins.forEach(function (plugin) {

            var pipe = pluginExist(plugin.name, plugin.options);

            if(pipe) {
                task = task.pipe(pipe(plugin.options));
            }
        });

        return task;
    }


    /**
     * Check if plugin exists
     * @access private
     * @param {Object} plugin
     * @returns {boolean}
     */
    function pluginExist(pluginName, options) {

        try {
            var plugin = require(pluginName);

            gutil.log('Plugin:',
                gutil.colors.green(pluginName),
                'with options:',
                options || gutil.colors.yellow('no options')
            );

            return plugin;
        } catch(err) {

            gutil.log(gutil.colors.red('Error:'), 'Plugin', gutil.colors.green(pluginName), 'not found');
            return false;
        }
    }

    /**
     * Parse configs content
     * @access private
     * @param {Array} files
     * @returns {Array}
     */
    function getConfigs() {

        var configs = [];

        if(this.__configs.length) {
            return this.__configs;
        }

        var files = getConfigFiles();

        if(Array.isArray(files) && files.length) {

            files.forEach(function(file) {

                var config = getConfigFromFile(file);
                configs.push(config);
            });
        }

        return configs;
    }

    /**
     * Get content of each config file
     * @access private
     * @param {string} fileName
     * @returns {*}
     */
    function getConfigFromFile(fileName) {

        if(!fileExists(fileName)) {

            gutil.log(gutil.colors.red('Error:'), 'config file doesn\'t exist');
        }

        return require(fileName);
    }

    /**
     * Get list of all *.json config files
     * @access private
     * @returns {*}
     */
    function getConfigFiles() {

        var configs = glob.sync(configsPath + '/*.json');
        return configs;
    }

    /**
     * Generate random string fo task name
     * @access private
     * @returns {string}
     */
    function randomTaskName() {

        return Math.random().toString(36).substring(7);
    }

    return addTasks.call(this);
};

/**
 * Set configs path
 * @access public
 * @param {string} configsPath
 * @example
 * // Will set path to configs <appRoot>/configs/
 * gulpFromConfig.setConfigsPath('configs');
 * @returns {boolean}
 */
var setConfigsPath = function setConfigsPath(configsPath) {

    this.__config = {
        paths: {
            config: path.join(rootPath, configsPath)
        }
    };
    return true;
};

/**
 * Set task configs
 * @access public
 * @param {Array} configs
 * @example
 * // Will set path to configs <appRoot>/configs/
 * gulpFromConfig.setConfigs([
 *   {
 *     name: "taskName",
 *       subTasks: [
 *       {
 *         name: "script",
 *         dest: "/dest/scripts",
 *         sourcemaps: true,
 *         src: {
 *           include: [
 *             "src/scripts/*.js"
 *           ]
 *         },
 *         plugins: [
 *           {
 *             name: "concat",
 *             options: "app.js"
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]);
 * @returns {boolean}
 */
var setConfigs = function setConfigs(configs) {

    if(Array.isArray(configs) && configs.length) {

        configs.filter(function(config) {

            if (!Object.keys(config).length) {

                gutil.log(gutil.colors.red('Error:'), 'wrong config format is passed');
                return false;
            }

            this.__configs.push(config);

            return true;

        }.bind(this));

        return true;
    } else {

        gutil.log(gutil.colors.red('Error:'),'must be array of configurations');
        process.exit(1);
    }
};

/**
 * Set callback which called on task completion
 * @param {Function} callback
 */
var setCallback = function setCallback(callback) {

    if(typeof callback === 'function') {
        this.__taskCompletion = callback;
    } else {
        gutil.log(gutil.colors.yellow('Warning:'), 'taskCompletion is not a function');
    }
};

module.exports = {
    __config: null,
    __configs: [],
    __taskCompletion: function(config) {
    },
    setCallback: setCallback,
    setConfigs: setConfigs,
    setConfigsPath: setConfigsPath,
    createTasks: createTasks
};
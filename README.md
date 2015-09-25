# gulp-from-config

**`gulp-from-config`** provides ability to run gulp tasks from configs.

## Why

- Team work on the same project without risk of breaking other tasks
- Store multiple typical tasks as configs
- Write clean and specific to applicaion gulpfile

### Caveates

- test coverage needed

## Install

```bash
$ npm install gulp gulp-load-plugins gulp-from-config
```

## As simple as

#### write tasks in configs

```javascript

// Load gulp with plugins loader and gulp-from-config
var gulp = require('gulp'),
    gulpPlugins = require('gulp-load-plugins')(),
    gulpFromConfig = require('gulp-from-config');

    // Set config files path
    gulpFromConfig.setConfigsPath('configs');

    // Create tasks
    gulpFromConfig.createTasks(gulp, gulpPlugins);
```

#### and run them as any other gulp tasks from console:

```bash
$ gulp dev
```

## Usage

```javascript
'use strict';

/**
 *  At the beginning load:
 *  - gulp
 *  - gulp-load-plugins
 *  - gulp-from-config
 */
var gulp = require('gulp'),
    gulpPlugins = require('gulp-load-plugins')(),
    gulpFromConfig = require('gulp-from-config');

    /**
     *  First option is to get tasks from configs
     *  and set path to files.
     *
     *  For example to ./configs directory
     */
    gulpFromConfig.setConfigsPath('configs');

    /**
     *  Or set array of configs as parameter
     */
    var task = {
        name: "shared", // module task name
            subTasks: [
                {
                    name: "script", // technical task name
                    dest: "/dest/js", // path to build
                    sourcemaps: true, // enable sourcemaps
                    src: {
                        include: [
                            "/src/js/*.js" // files to proceed
                        ]
                    },
                    plugins: [
                        {
                            name: "concat", // will run gulp-concat
                            options: "app.js" // wiil be passed to plugin parameter
                        }
                    ]
                }
            ]
    };

    gulpFromConfig.setConfigs([task]);

    /**
     *  Callback function can to be triggered on completion of subtasks
     *  Sub task config is passed to callback parameter
     */
    var callback = function(config) {
        console.log('Config:', config);
    }
    gulpFromConfig.setCallback(callback);

    /**
     *  Define tasks based on configs
     *  Run like normal gulp task 'gulp shared'
     */
    gulpFromConfig.defineTasks(gulp, gulpPlugins);
```
> Example gulpfile.js

## config

```javascript
{
    "name": "production", // task name which can be called by 'gulp production'
    "subTasks": [
        {
            "name": "script", // sub task name
            "dest": "/dest/css", // for gulp.dest('/dest/css')
            "sourcemaps": true, // if sourcemaps are required
            "watch": [ // if array is empty will watch src files
                "/src/sass/*.sass", // watch changes on source files
                "/src/sass/_*.sass"
            ],
            "src": {
                "include": [
                    "/src/sass/*.sass" // will be proceeded
                ],
                "exclude": [
                    "/src/sass/_*.sass" // will be ignored
                ]
            },
            "plugins": [
                {
                    "name": "sass", // gulp-sass plugin
                    "options": {
                        "outputStyle": "compressed" // will be passed into gulp.pipe(sass(options))
                    }
                }
            ]
        }
    ]
};
```
> Example production.json

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [gulp](http://gulpjs.com/).

## Release History

- **0.1.0** Initial release

- **0.1.5** Task callback

## License

Copyright (c) 2015 Efim Solovyev. Licensed under the MIT license.
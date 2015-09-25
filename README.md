# gulp-from-config

**`gulp-from-config`** provides ability to run gulp tasks from configs.

## Why

- You don't want to struggle with task runner code, are you?

### Caveates

- test coverage needed

## Install

```bash
$ npm install gulp gulp-load-plugins gulp-from-config
```

## Usage

```javascript
'use strict';

// First require gulp, gulp-load-plugins and gulp-from-config
var gulp = require('gulp'),
    gulpPlugins = require('gulp-load-plugins')(),
    gulpFromConfig = require('gulp-from-config');

    // Get configs from ./config directory
    gulpFromConfig.setConfigsPath('config');

    // Or set configs array as parameter
    var task = {
        name: "task",
            subTasks: [
                {
                    name: "script",
                    dest: "/dest/js",
                    sourcemaps: true,
                    src: {
                        include: [
                            "/src/js/*.js"
                        ]
                    },
                    plugins: [
                        {
                            name: "concat",
                            options: "app.js"
                        }
                    ]
                }
            ]
    };

    gulpFromConfig.setConfigs([task]);

    // Pass callback which will be triggered on completion of subtasks
    // it accept one parameter which is config of subtask of task
    var callback = function(config) {
        console.log(config);
    }
    gulpFromConfig.setCallback(callback);

    // Define tasks based on configs
    gulpFromConfig.defineTasks(gulp, gulpPlugins);
```
> Example gulpfile.js

## config

```javascript
{
    "name": "test", // task name which can be called by 'gulp test'
    "subTasks": [
        {
            "name": "script", //sub task name
            "dest": "/dest/css", // gulp.dest('/dest/css')
            "sourcemaps": true, // If sourcemaps are required
            "watch": [ // by default all source files will be watched
                "/src/sass/*.sass",
                "/src/sass/_*.sass"
            ],
            "src": {
                "include": [
                    "/src/sass/*.sass" // pattern for required sources
                ],
                "exclude": [
                    "/src/sass/_*.sass" // pattern for ignored by gulp sources
                ]
            },
            "plugins": [
                {
                    "name": "sass", // gulp-sass
                    "options": {
                        "outputStyle": "compressed" // will be passed into gulp.pipe(sass(options))
                    }
                }
            ]
        }
    ]
};
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [gulp](http://gulpjs.com/).

## Release History

- **0.1.0** Initial release

## License

Copyright (c) 2015 Efim Solovyev. Licensed under the MIT license.
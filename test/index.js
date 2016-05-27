'use strict';

var rewire = require('rewire'),
    expect = require('chai').expect,
    fsMock = require('mock-fs'),
    sinon = require('sinon'),
    gulpFromConfig = rewire('./../index.js'),
    set = gulpFromConfig.__set__,
    get = gulpFromConfig.__get__;

describe('gulp-from-config', function () {

    var gutil,
        logSpy,
        redSpy,
        greenSpy,
        yellowSpy,
        cyanSpy,
        blueSpy,
        magentaSpy;

    function prepareSpyes() {

        logSpy = sinon.spy();
        redSpy = sinon.spy();
        greenSpy = sinon.spy();
        yellowSpy = sinon.spy();
        cyanSpy = sinon.spy();
        blueSpy = sinon.spy();
        magentaSpy = sinon.spy();

        gutil = set('gutil', {
            log: logSpy,
            colors: {
                red: redSpy,
                green: greenSpy,
                yellow: yellowSpy,
                cyan: cyanSpy,
                blue: blueSpy,
                magenta: magentaSpy
            }
        });
    }

    it('is defined', function () {

        expect(gulpFromConfig).to.be.a('object');
    });

    it('has public functions getConfigs and createTasks', function() {

        expect(gulpFromConfig)
            .to.have.property('getConfigs')
            .to.be.a('function');

        expect(gulpFromConfig)
            .to.have.property('createTasks')
            .to.be.a('function');
    });

    describe('private functions:', function () {

        describe('randomTaskName', function () {

            var randomTaskName;

            before(function() {

                randomTaskName = get('randomTaskName');
            })

            it('should return a string', function() {

                expect(randomTaskName()).to.be.a('string');
            });
        });

        describe('getConfigFiles', function () {

            var getConfigFiles,
                files,
                globMock;

            before(function () {

                globMock = set('glob', {
                    sync: function (path) {
                        return [{}];
                    }
                });
                getConfigFiles = get('getConfigFiles');
            });

            it('should load files and return array', function() {

                files = getConfigFiles('configs');

                expect(files)
                    .to.be.an('array')
                    .to.have.length.at.least(1);
            });

            after(function () {

                globMock();
            });
        });

        describe('getConfigFromFile', function () {

            var getConfigFromFile,
                requireMock,
                fileExistsMock;

            before(function () {

                getConfigFromFile = get('getConfigFromFile');
            });

            describe('file exists' ,function () {

                before(function () {

                    fileExistsMock = set('fileExists', function (file) {
                        return true;
                    });
                    requireMock = set('require', function (file) {
                        return {};
                    });
                });

                it('should return config from file', function () {

                    var config = getConfigFromFile('prod.json');

                    expect(config)
                        .to.be.an('object');
                });
            });

            describe('file doesn\'t exists', function () {

                before(function () {

                    prepareSpyes();

                    fileExistsMock = set('fileExists', function (file) {
                        return false;
                    });
                });

                it('should return false', function() {

                    var config = getConfigFromFile('prod.json');
                    expect(logSpy.calledOnce).to.be.ok;
                    expect(redSpy.calledOnce).to.be.ok;
                });
            });

            after(function () {
                fileExistsMock();
                requireMock();
            });
        });

        describe('setConfigs', function () {

            var mock,
                setConfigs,
                processMock;

            before(function () {
                setConfigs = get('setConfigs');
            });

            describe('correct config', function () {

                before(function () {
                    mock = [{name: 'test'}];
                })

                it('should return array with configurations', function() {

                    var configs = setConfigs(mock);

                    expect(configs)
                        .to.be.an('array')
                        .to.have.length.at.least(1);
                });
            });

            describe('wrong config', function () {

                before(function () {
                    prepareSpyes();
                    mock = [{}];
                })

                it('should log warning', function() {

                    var configs = setConfigs(mock);

                    expect(logSpy.calledOnce).to.be.ok;
                    expect(yellowSpy.calledOnce).to.be.ok;
                    expect(configs).to.be.an('array');
                });
            });

            describe('no configs', function () {

                before(function () {

                    prepareSpyes();

                    var exitSpy = sinon.spy();

                    mock = [];
                    processMock = set('process', {
                        exit: exitSpy
                    });
                })

                it('should exit script', function() {

                    setConfigs(mock);

                    expect(logSpy.calledOnce).to.be.ok;
                    expect(redSpy.calledOnce).to.be.ok;
                });
            });

            after(function () {

                processMock();
            });
        });

        describe('pluginExist', function () {
            
            var requireMock,
                pluginExist;

            before(function() {

                pluginExist = get('pluginExist');
            });

            describe('plugin exist', function() {

                before(function() {
                    requireMock = set('require', function() {

                        return function test() {};
                    });
                });

                it('should return gulp plugin', function() {

                    expect(pluginExist('test')).to.be.a('function');
                });
            });

            describe('plugin doesn\'t exist', function() {

                before(function() {

                    requireMock = set('require', function() {

                        throw Error();
                    });
                });

                it('should return false', function() {

                    expect(pluginExist('test')).to.be.false;
                });
            });
        });

        describe('setPlugins', function() {

            var setPlugins,
                pluginExistMock,
                taskMock,
                pipeSpy,
                plugins;

            before(function() {

                pipeSpy = sinon.spy();

                taskMock = new function() {

                    this.pipe = function() {
                        pipeSpy();
                        return this;
                    }.bind(this);
                }

                setPlugins = get('setPlugins');
            });

            describe('plugin with option and without', function() {

                before(function() {

                    prepareSpyes();

                    plugins = [{
                        name: 'test'
                    },{
                        name: 'testOptions',
                        options: {}
                    }];

                    pluginExistMock = set('pluginExist', function() {
                        return function() {};
                    });
                });

                it('should return gulp task', function() {

                    expect(setPlugins(taskMock, plugins)).to.equal(taskMock);
                    expect(logSpy.calledTwice).to.be.ok;
                    expect(greenSpy.calledTwice).to.be.ok;
                    expect(yellowSpy.called).to.be.ok;
                });
            });

            describe('plugin doesn\'t exist', function() {

                before(function() {

                    prepareSpyes();

                    plugins = [{}];

                    pluginExistMock = set('pluginExist', function() {
                        return false;
                    });
                });

                it('should return gulp task', function() {

                    expect(setPlugins(taskMock, plugins)).to.equal(taskMock);
                    expect(logSpy.calledOnce).to.be.ok;
                    expect(redSpy.calledOnce).to.be.ok;
                    expect(greenSpy.calledOnce).to.be.ok;
                });
            });

            after(function () {
                pluginExistMock();
            })
        });

        describe('setSourceMaps', function () {

            var setSourceMaps,
                setPluginsMock,
                taskMock,
                sourceMaps = true,
                initSpy,
                writeSpy,
                pipeSpy,
                pluginExistMock;

            before(function () {

                initSpy = sinon.spy();
                writeSpy = sinon.spy();
                pipeSpy = sinon.spy();

                taskMock = new function() {

                    this.pipe = function() {
                        pipeSpy();
                        return this;
                    }.bind(this);
                };

                pluginExistMock = set('pluginExist', function() {
                    return {
                        init: initSpy
                        ,write: writeSpy
                    }
                });

                setPluginsMock = set('setPlugins', function() {
                    return taskMock;
                });

                setSourceMaps = get('setSourceMaps');
            });

            describe('sourcemaps required', function() {

                it('should set sourcemaps and return task', function () {

                    expect(setSourceMaps(taskMock, sourceMaps)).to.equal(taskMock);
                    expect(pipeSpy.calledTwice).to.be.ok;
                    expect(initSpy.calledWith({loadMaps: true})).to.be.ok;
                    expect(writeSpy.calledOnce).to.be.ok;
                });
            });

            describe('sourcemaps are not required', function () {

                before(function () {

                    sourceMaps = false;

                    initSpy = sinon.spy();
                    writeSpy = sinon.spy();
                    pipeSpy = sinon.spy();
                });

                it('shouldn\'t  set sourcemapsk', function () {

                    expect(setSourceMaps(taskMock, sourceMaps)).to.equal(taskMock);
                    expect(pipeSpy.called).to.be.false;
                    expect(initSpy.called).to.be.false;
                    expect(writeSpy.called).to.be.false;
                });
            });

            after(function () {

                pluginExistMock();
                setPluginsMock();
            })
        });

        describe('setPipes', function () {

            var setSourceMapsMock,
                taskMock = {},
                plugins,
                setPipes;

            before(function () {

                setPipes = get('setPipes');

                setSourceMapsMock = set('setSourceMaps', function () {

                    return taskMock;
                });
            });

            describe('plugins are passed', function () {

                before(function () {

                    prepareSpyes();

                    plugins = [{}];
                });

                it('should set plugins', function () {

                    expect(setPipes(taskMock, plugins)).to.equal(taskMock);
                    expect(logSpy.calledOnce).to.be.ok;
                    expect(blueSpy.calledOnce).to.be.ok;
                });
            });

            describe('plugins undefined', function () {

                before(function () {

                    prepareSpyes();

                    plugins = null;
                });

                it('should log warning and return task', function () {

                    expect(setPipes(taskMock, plugins)).to.equal(taskMock);
                    expect(logSpy.calledOnce).to.be.ok;
                    expect(yellowSpy.calledOnce).to.be.ok;
                });
            });

            after(function () {

                setSourceMapsMock();
            })
        });

        describe('setFullPaths', function () {

            var paths,
                rootPathMock,
                setFullPaths;

            before(function () {

                paths = [
                    'one',
                    'two',
                ];

                rootPathMock = set('rootPath', '/test/');
                setFullPaths = get('setFullPaths');
            });

            it('should return absolute paths', function () {

                var fullPaths = setFullPaths(paths);

                expect(fullPaths)
                    .to.be.an('array')
                    .length.of.at.least(2)
                    .to.eql([
                        '/test/one',
                        '/test/two',
                    ]);
            });

            after(function () {

                rootPathMock();
            })
        });

        describe('setWatchPaths', function () {

            var subTask,
                setFullPathsMock,
                setWatchPathsMock;

            before(function () {

                setWatchPathsMock = get('setWatchPaths');

                setFullPathsMock = set('setFullPaths', function (paths) {

                    return paths.map(function (el) {

                        return '/fullpath/' + el;
                    });
                });
            });

            describe('watch is array', function () {

                before(function () {

                    subTask = {
                        watch: [
                            'test/',
                        ]
                    };
                });

                it('should add project path to watch path', function () {

                    expect(setWatchPathsMock(subTask))
                        .to.be.an('array')
                        .to.eql([
                            '/fullpath/test/'
                        ]);
                });
            });

            describe('watch is true', function () {

                before(function () {

                    subTask = {
                        watch: true,
                        src: {
                            include: [
                                'src/'
                            ],
                            exclude: [
                                'src/private/'
                            ]
                        }
                    };
                });

                it('should set src as watch path', function () {

                    expect(setWatchPathsMock(subTask))
                        .to.be.an('array')
                        .to.eql([
                            '/fullpath/src/',
                            '/fullpath/src/private/'
                        ]);
                });
            });


            describe('watch is false', function () {

                before(function () {

                    subTask = {
                        watch: false
                    };
                });

                it('should return empty array', function () {

                    expect(setWatchPathsMock(subTask))
                        .to.be.an('array')
                        .to.be.length(0);
                });
            });

            after(function () {

                setFullPathsMock();
            })
        });

        describe('setWatch', function () {

            var setWatchPaths,
                minimizePathMock,
                setWatchPathsMock,
                setWatch;

            before(function () {

                setWatch = get('setWatch');

                minimizePathMock = set('minimizePathMock', function (path) {

                });
            })
        });
    });
});
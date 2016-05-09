'use strict';

var gulpFromConfig = require('./../index.js'),
    expect = require('chai').expect,
    fsMock = require('mock-fs'),
    sinon = require('sinon'),
    gulp = require('gulp');

describe('gulp-from-config', function () {

    it('is defined', function () {
        expect(gulpFromConfig).to.be.a('object');
    });

    describe('private functions', function () {

        describe('getConfigFiles', function () {

            before(function () {
                
                fsMock({
                    configs: {
                        'prod.json': '{}'
                    }
                });
            });

            it('should load files from ./configs and return array', function() {
                
                var files = gulpFromConfig._getConfigFiles('configs');

                expect(files)
                    .to.be.an('array')
                    .to.have.length.at.least(1);
            });
        });

        describe('getConfigFromFile if file exists', function () {
            
            before(function () {
                
                fsMock({
                    configs: {
                        'prod.json': '{}'
                    }
                });
            });

            it('should return config from file', function() {
                
                var config = gulpFromConfig._getConfigFromFile('./configs/prod.json');

                expect(config)
                    .to.be.an('object');
            });
        });
        describe('getConfigFromFile if file doesn\'t exists', function () {
            before(function () {
                
                fsMock({
                    configs: {}
                });
            });

            it('should return false', function() {
                
                var config = gulpFromConfig._getConfigFromFile('./configs/prod.json');

                expect(config).to.be.false;
            });
        });

        describe('setConfigs', function () {
            
            it('should return array with configurations', function() {
                
                var mock = [
                        {
                            name: 'test'
                        }
                    ],
                    configs = gulpFromConfig._setConfigs(mock);

                expect(configs)
                    .to.be.an('array')
                    .to.have.length.at.least(1);
            });
        });

        describe('randomTaskName', function () {
            
            it('should return a string', function() {
                
                expect(gulpFromConfig._randomTaskName()).to.be.a('string');
            });
        });

        describe('pluginExist', function () {
            
            var pluginName = 'gulp-test',
                spy;

            before(function() {

                fsMock({
                    node_modules: {
                        'gulp-test.js': 'module.exports = function testPlugin(name) {};'
                    }
                });
            });

            it('should return gulp plugin', function() {

                expect(gulpFromConfig._pluginExist(pluginName)).to.be.a('function');
            });
        });

        describe('setPlugins', function () {
            
            var pluginName = 'gulp-test',
                task = {
                    pipe: function() {
                        return task;
                    }
                },
                plugins = [
                    {
                        name: 'gulp-test',
                        options: {
                            option: 'test'
                        }
                    }
                ];

            before(function() {

                sinon.spy(task, 'pipe');
            });

            it('should return gulp with pipes', function() {
                expect(gulpFromConfig._setPlugins(task, plugins)).to.be.a('object');
                expect(task.pipe.calledOnce).to.be.ok;
            });
        });
    });
});
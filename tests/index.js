'use strict';

var gulpFromConfig = require('./../index.js'),
    expect = require('chai').expect,
    fsMock = require('mock-fs');

describe('gulp-from-config', function () {

    before(function () {
        
        fsMock({
            configs: {
                'prod.json': '{}',
                'test.json' : '{}'
            },
            src: {
                styles: {
                    'global.sass': '@import _module',
                    '_module.sass': '//test'
                }
            },
            dest: {}
        });
    });

    it('gulp-from-config is defined', function () {
        expect(gulpFromConfig).to.be.a('object');
    });

    describe('private functions', function () {

        it('getConfigFiles should load files from ./configs', function() {
            
            var files = gulpFromConfig._getConfigFiles('configs');

            expect(files)
                .to.be.an('array')
                .to.have.length(2);
        });

        it('getConfigFromFile should return config from file', function() {
            
            var config = gulpFromConfig._getConfigFromFile('./configs/prod.json');

            expect(config)
                .to.be.an('object');
        });
    });
});
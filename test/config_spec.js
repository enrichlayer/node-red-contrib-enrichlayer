const helper = require('node-red-node-test-helper');
const configNode = require('../nodes/config/enrichlayer-config');

helper.init(require.resolve('node-red'));

describe('enrichlayer-config Node', function () {
    afterEach(function (done) {
        helper.unload().then(function () { done(); });
    });

    it('should be loaded', function (done) {
        const flow = [{ id: 'c1', type: 'enrichlayer-config', name: 'Test Config' }];
        helper.load(configNode, flow, function () {
            const n = helper.getNode('c1');
            n.should.have.property('name', 'Test Config');
            done();
        });
    });

    it('should have default base URL', function (done) {
        const flow = [{ id: 'c1', type: 'enrichlayer-config', name: '' }];
        helper.load(configNode, flow, function () {
            const n = helper.getNode('c1');
            n.should.have.property('baseUrl', 'https://enrichlayer.com');
            done();
        });
    });

    it('should accept custom base URL', function (done) {
        const flow = [{ id: 'c1', type: 'enrichlayer-config', name: '', baseUrl: 'https://custom.api.com' }];
        helper.load(configNode, flow, function () {
            const n = helper.getNode('c1');
            n.should.have.property('baseUrl', 'https://custom.api.com');
            done();
        });
    });

    it('should store credentials', function (done) {
        const flow = [{ id: 'c1', type: 'enrichlayer-config', name: '' }];
        const credentials = { c1: { apiKey: 'test-key-123' } };
        helper.load(configNode, flow, credentials, function () {
            const n = helper.getNode('c1');
            n.credentials.should.have.property('apiKey', 'test-key-123');
            done();
        });
    });
});

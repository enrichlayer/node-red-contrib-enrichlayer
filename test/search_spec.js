const helper = require('node-red-node-test-helper');
const searchNode = require('../nodes/search/enrichlayer-search');
const configNode = require('../nodes/config/enrichlayer-config');
const nock = require('nock');

helper.init(require.resolve('node-red'));

describe('enrichlayer-search Node', function () {
    beforeEach(function () { nock.cleanAll(); });
    afterEach(function (done) { helper.unload().then(function () { done(); }); });

    it('should be loaded', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-search', name: 'Test Search', config: 'c1', operation: 'searchCompanies' }
        ];
        helper.load([configNode, searchNode], flow, function () {
            const n = helper.getNode('n1');
            n.should.have.property('name', 'Test Search');
            done();
        });
    });

    it('should search companies', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-search', config: 'c1', operation: 'searchCompanies', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/search/company')
            .query({ country: 'US', industry: 'technology' })
            .reply(200, { results: [{ name: 'TechCorp', url: 'https://linkedin.com/company/techcorp' }] });

        helper.load([configNode, searchNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('results');
                msg.payload.results.should.have.length(1);
                done();
            });
            n1.receive({ payload: { country: 'US', industry: 'technology' } });
        });
    });

    it('should search people', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-search', config: 'c1', operation: 'searchPeople', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/search/person')
            .query({ country: 'US', current_role_title: 'CEO' })
            .reply(200, { results: [{ full_name: 'Jane CEO' }] });

        helper.load([configNode, searchNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('results');
                done();
            });
            n1.receive({ payload: { country: 'US', current_role_title: 'CEO' } });
        });
    });

    it('should handle API errors', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-search', config: 'c1', operation: 'searchCompanies', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/search/company')
            .query(true)
            .reply(429, { message: 'Rate limit exceeded' });

        helper.load([configNode, searchNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            n1.on('call:error', function (call) {
                call.firstArg.message.should.containEql('429');
                done();
            });
            n1.receive({ payload: { country: 'US' } });
        });
    });
});

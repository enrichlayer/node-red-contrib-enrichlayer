const helper = require('node-red-node-test-helper');
const companyNode = require('../nodes/company/enrichlayer-company');
const configNode = require('../nodes/config/enrichlayer-config');
const nock = require('nock');

helper.init(require.resolve('node-red'));

describe('enrichlayer-company Node', function () {
    beforeEach(function () {
        nock.cleanAll();
    });

    afterEach(function (done) {
        helper.unload().then(function () { done(); });
    });

    it('should be loaded', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-company', name: 'Test Company', config: 'c1', operation: 'getCompanyProfile' }
        ];
        helper.load([configNode, companyNode], flow, function () {
            const n = helper.getNode('n1');
            n.should.have.property('name', 'Test Company');
            done();
        });
    });

    it('should get company profile', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-company', config: 'c1', operation: 'getCompanyProfile', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/company')
            .query({ url: 'https://linkedin.com/company/google' })
            .reply(200, { name: 'Google', industry: 'Technology' });

        helper.load([configNode, companyNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('name', 'Google');
                msg.payload.should.have.property('industry', 'Technology');
                done();
            });
            n1.receive({ payload: { url: 'https://linkedin.com/company/google' } });
        });
    });

    it('should lookup company by domain', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-company', config: 'c1', operation: 'lookupCompany', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/company/resolve')
            .query({ company_domain: 'google.com' })
            .reply(200, { url: 'https://linkedin.com/company/google' });

        helper.load([configNode, companyNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('url');
                done();
            });
            n1.receive({ payload: { company_domain: 'google.com' } });
        });
    });

    it('should lookup company by ID', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-company', config: 'c1', operation: 'lookupCompanyById', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/company/resolve-id')
            .query({ id: '1441' })
            .reply(200, { url: 'https://linkedin.com/company/apple' });

        helper.load([configNode, companyNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('url');
                done();
            });
            n1.receive({ payload: { id: '1441' } });
        });
    });

    it('should get company profile picture', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-company', config: 'c1', operation: 'getCompanyProfilePicture', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/company/profile-picture')
            .query({ company_profile_url: 'https://linkedin.com/company/apple' })
            .reply(200, { tmp_profile_pic_url: 'https://example.com/pic.jpg' });

        helper.load([configNode, companyNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('tmp_profile_pic_url');
                done();
            });
            n1.receive({ payload: { company_profile_url: 'https://linkedin.com/company/apple' } });
        });
    });

    it('should handle API errors', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-company', config: 'c1', operation: 'getCompanyProfile', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/company')
            .query(true)
            .reply(401, { message: 'Invalid API key' });

        helper.load([configNode, companyNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            n1.on('call:error', function (call) {
                call.firstArg.message.should.containEql('401');
                done();
            });
            n1.receive({ payload: { url: 'https://linkedin.com/company/test' } });
        });
    });

    it('should error when config is missing', function (done) {
        const flow = [
            { id: 'n1', type: 'enrichlayer-company', config: '', operation: 'getCompanyProfile', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];

        helper.load([configNode, companyNode], flow, function () {
            const n1 = helper.getNode('n1');
            n1.on('call:error', function (call) {
                call.firstArg.message.should.containEql('config not set');
                done();
            });
            n1.receive({ payload: {} });
        });
    });
});

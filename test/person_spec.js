const helper = require('node-red-node-test-helper');
const personNode = require('../nodes/person/enrichlayer-person');
const configNode = require('../nodes/config/enrichlayer-config');
const nock = require('nock');

helper.init(require.resolve('node-red'));

describe('enrichlayer-person Node', function () {
    beforeEach(function () { nock.cleanAll(); });
    afterEach(function (done) { helper.unload().then(function () { done(); }); });

    it('should be loaded', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-person', name: 'Test Person', config: 'c1', operation: 'getPersonProfile' }
        ];
        helper.load([configNode, personNode], flow, function () {
            const n = helper.getNode('n1');
            n.should.have.property('name', 'Test Person');
            done();
        });
    });

    it('should get person profile', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-person', config: 'c1', operation: 'getPersonProfile', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/profile')
            .query({ profile_url: 'https://linkedin.com/in/johnrmarty' })
            .reply(200, { full_name: 'John Marty', headline: 'CEO' });

        helper.load([configNode, personNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('full_name', 'John Marty');
                done();
            });
            n1.receive({ payload: { profile_url: 'https://linkedin.com/in/johnrmarty' } });
        });
    });

    it('should lookup person', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-person', config: 'c1', operation: 'lookupPerson', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/profile/resolve')
            .query({ first_name: 'Bill', company_domain: 'gatesfoundation.org' })
            .reply(200, { profile_url: 'https://linkedin.com/in/williamhgates' });

        helper.load([configNode, personNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('profile_url');
                done();
            });
            n1.receive({ payload: { first_name: 'Bill', company_domain: 'gatesfoundation.org' } });
        });
    });

    it('should get person profile picture', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-person', config: 'c1', operation: 'getPersonProfilePicture', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/person/profile-picture')
            .query({ person_profile_url: 'https://linkedin.com/in/williamhgates' })
            .reply(200, { tmp_profile_pic_url: 'https://example.com/pic.jpg' });

        helper.load([configNode, personNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('tmp_profile_pic_url');
                done();
            });
            n1.receive({ payload: { person_profile_url: 'https://linkedin.com/in/williamhgates' } });
        });
    });

    it('should lookup role', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-person', config: 'c1', operation: 'lookupRole', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/find/company/role/')
            .query({ company_name: 'enrichlayer', role: 'ceo' })
            .reply(200, { profile_url: 'https://linkedin.com/in/ceo' });

        helper.load([configNode, personNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('profile_url');
                done();
            });
            n1.receive({ payload: { company_name: 'enrichlayer', role: 'ceo' } });
        });
    });

    it('should handle API errors', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-person', config: 'c1', operation: 'getPersonProfile', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'bad-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/profile')
            .query(true)
            .reply(403, { message: 'Forbidden' });

        helper.load([configNode, personNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            n1.on('call:error', function (call) {
                call.firstArg.message.should.containEql('403');
                done();
            });
            n1.receive({ payload: { profile_url: 'https://linkedin.com/in/test' } });
        });
    });
});

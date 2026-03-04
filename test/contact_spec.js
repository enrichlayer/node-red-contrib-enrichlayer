const helper = require('node-red-node-test-helper');
const contactNode = require('../nodes/contact/enrichlayer-contact');
const configNode = require('../nodes/config/enrichlayer-config');
const nock = require('nock');

helper.init(require.resolve('node-red'));

describe('enrichlayer-contact Node', function () {
    beforeEach(function () { nock.cleanAll(); });
    afterEach(function (done) { helper.unload().then(function () { done(); }); });

    it('should be loaded', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-contact', name: 'Test Contact', config: 'c1', operation: 'reverseEmailLookup' }
        ];
        helper.load([configNode, contactNode], flow, function () {
            const n = helper.getNode('n1');
            n.should.have.property('name', 'Test Contact');
            done();
        });
    });

    it('should reverse email lookup', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-contact', config: 'c1', operation: 'reverseEmailLookup', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/profile/resolve/email')
            .query({ email: 'test@example.com' })
            .reply(200, { profile_url: 'https://linkedin.com/in/test' });

        helper.load([configNode, contactNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('profile_url');
                done();
            });
            n1.receive({ payload: { email: 'test@example.com' } });
        });
    });

    it('should reverse phone lookup', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-contact', config: 'c1', operation: 'reversePhoneLookup', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/resolve/phone')
            .query({ phone_number: '+14155552671' })
            .reply(200, { profile_url: 'https://linkedin.com/in/test' });

        helper.load([configNode, contactNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('profile_url');
                done();
            });
            n1.receive({ payload: { phone_number: '+14155552671' } });
        });
    });

    it('should lookup work email', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-contact', config: 'c1', operation: 'lookupWorkEmail', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/profile/email')
            .query({ profile_url: 'https://linkedin.com/in/williamhgates' })
            .reply(200, { email: 'bill@gatesfoundation.org' });

        helper.load([configNode, contactNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('email');
                done();
            });
            n1.receive({ payload: { profile_url: 'https://linkedin.com/in/williamhgates' } });
        });
    });

    it('should check disposable email', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-contact', config: 'c1', operation: 'checkDisposableEmail', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/disposable-email')
            .query({ email: 'test@tempmail.com' })
            .reply(200, { is_disposable_email: true });

        helper.load([configNode, contactNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('is_disposable_email', true);
                done();
            });
            n1.receive({ payload: { email: 'test@tempmail.com' } });
        });
    });

    it('should get personal contact', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-contact', config: 'c1', operation: 'getPersonalContact', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/contact-api/personal-contact')
            .query({ profile_url: 'https://linkedin.com/in/test' })
            .reply(200, { numbers: ['+1234567890'] });

        helper.load([configNode, contactNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('numbers');
                done();
            });
            n1.receive({ payload: { profile_url: 'https://linkedin.com/in/test' } });
        });
    });

    it('should get personal email', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-contact', config: 'c1', operation: 'getPersonalEmail', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/contact-api/personal-email')
            .query({ profile_url: 'https://linkedin.com/in/test' })
            .reply(200, { emails: ['test@gmail.com'] });

        helper.load([configNode, contactNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('emails');
                done();
            });
            n1.receive({ payload: { profile_url: 'https://linkedin.com/in/test' } });
        });
    });
});

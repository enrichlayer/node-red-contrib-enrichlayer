const helper = require('node-red-node-test-helper');
const metaNode = require('../nodes/meta/enrichlayer-meta');
const configNode = require('../nodes/config/enrichlayer-config');
const nock = require('nock');

helper.init(require.resolve('node-red'));

describe('enrichlayer-meta Node', function () {
    beforeEach(function () { nock.cleanAll(); });
    afterEach(function (done) { helper.unload().then(function () { done(); }); });

    it('should be loaded', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-meta', name: 'Test Meta', config: 'c1', operation: 'getCreditBalance' }
        ];
        helper.load([configNode, metaNode], flow, function () {
            const n = helper.getNode('n1');
            n.should.have.property('name', 'Test Meta');
            done();
        });
    });

    it('should get credit balance', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-meta', config: 'c1', operation: 'getCreditBalance', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/credit-balance')
            .reply(200, { credit_balance: 1000 });

        helper.load([configNode, metaNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('credit_balance', 1000);
                done();
            });
            n1.receive({ payload: {} });
        });
    });

    it('should handle API errors', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-meta', config: 'c1', operation: 'getCreditBalance', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'bad-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/credit-balance')
            .reply(401, { message: 'Unauthorized' });

        helper.load([configNode, metaNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            n1.on('call:error', function (call) {
                call.firstArg.message.should.containEql('401');
                done();
            });
            n1.receive({ payload: {} });
        });
    });

    it('should error when config is missing', function (done) {
        const flow = [
            { id: 'n1', type: 'enrichlayer-meta', config: '', operation: 'getCreditBalance', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];

        helper.load([configNode, metaNode], flow, function () {
            const n1 = helper.getNode('n1');
            n1.on('call:error', function (call) {
                call.firstArg.message.should.containEql('config not set');
                done();
            });
            n1.receive({ payload: {} });
        });
    });

    it('should handle unknown operation', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-meta', config: 'c1', operation: 'unknownOp', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        helper.load([configNode, metaNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            n1.on('call:error', function (call) {
                call.firstArg.message.should.containEql('Unknown operation');
                done();
            });
            n1.receive({ payload: {} });
        });
    });
});

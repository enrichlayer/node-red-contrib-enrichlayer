const helper = require('node-red-node-test-helper');
const schoolNode = require('../nodes/school/enrichlayer-school');
const configNode = require('../nodes/config/enrichlayer-config');
const nock = require('nock');

helper.init(require.resolve('node-red'));

describe('enrichlayer-school Node', function () {
    beforeEach(function () { nock.cleanAll(); });
    afterEach(function (done) { helper.unload().then(function () { done(); }); });

    it('should be loaded', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-school', name: 'Test School', config: 'c1', operation: 'getSchoolProfile' }
        ];
        helper.load([configNode, schoolNode], flow, function () {
            const n = helper.getNode('n1');
            n.should.have.property('name', 'Test School');
            done();
        });
    });

    it('should get school profile', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-school', config: 'c1', operation: 'getSchoolProfile', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/school')
            .query({ url: 'https://linkedin.com/school/stanford-university' })
            .reply(200, { name: 'Stanford University', founded_year: 1885 });

        helper.load([configNode, schoolNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('name', 'Stanford University');
                done();
            });
            n1.receive({ payload: { url: 'https://linkedin.com/school/stanford-university' } });
        });
    });

    it('should list students', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-school', config: 'c1', operation: 'listStudents', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/school/students/')
            .query({ school_url: 'https://linkedin.com/school/stanford-university' })
            .reply(200, { students: [{ full_name: 'Jane Doe' }] });

        helper.load([configNode, schoolNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('students');
                msg.payload.students.should.have.length(1);
                done();
            });
            n1.receive({ payload: { school_url: 'https://linkedin.com/school/stanford-university' } });
        });
    });

    it('should handle API errors', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-school', config: 'c1', operation: 'getSchoolProfile', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/school')
            .query(true)
            .reply(500, { message: 'Internal Server Error' });

        helper.load([configNode, schoolNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            n1.on('call:error', function (call) {
                call.firstArg.message.should.containEql('500');
                done();
            });
            n1.receive({ payload: { url: 'https://linkedin.com/school/test' } });
        });
    });
});

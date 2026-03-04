const helper = require('node-red-node-test-helper');
const jobNode = require('../nodes/job/enrichlayer-job');
const configNode = require('../nodes/config/enrichlayer-config');
const nock = require('nock');

helper.init(require.resolve('node-red'));

describe('enrichlayer-job Node', function () {
    beforeEach(function () { nock.cleanAll(); });
    afterEach(function (done) { helper.unload().then(function () { done(); }); });

    it('should be loaded', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-job', name: 'Test Job', config: 'c1', operation: 'getJobProfile' }
        ];
        helper.load([configNode, jobNode], flow, function () {
            const n = helper.getNode('n1');
            n.should.have.property('name', 'Test Job');
            done();
        });
    });

    it('should get job profile', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-job', config: 'c1', operation: 'getJobProfile', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/job')
            .query({ url: 'https://linkedin.com/jobs/view/123' })
            .reply(200, { job_title: 'Software Engineer', company: 'Google' });

        helper.load([configNode, jobNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('job_title', 'Software Engineer');
                done();
            });
            n1.receive({ payload: { url: 'https://linkedin.com/jobs/view/123' } });
        });
    });

    it('should search jobs', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-job', config: 'c1', operation: 'searchJobs', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/company/job')
            .query({ search_id: '2790400', keyword: 'engineer' })
            .reply(200, { jobs: [{ title: 'Senior Engineer' }] });

        helper.load([configNode, jobNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('jobs');
                done();
            });
            n1.receive({ payload: { search_id: '2790400', keyword: 'engineer' } });
        });
    });

    it('should get job count', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-job', config: 'c1', operation: 'getJobCount', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/company/job/count')
            .query({ search_id: '2790400' })
            .reply(200, { count: 42 });

        helper.load([configNode, jobNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            const out = helper.getNode('out');
            out.on('input', function (msg) {
                msg.payload.should.have.property('count', 42);
                done();
            });
            n1.receive({ payload: { search_id: '2790400' } });
        });
    });

    it('should handle API errors', function (done) {
        const flow = [
            { id: 'c1', type: 'enrichlayer-config', name: '' },
            { id: 'n1', type: 'enrichlayer-job', config: 'c1', operation: 'getJobProfile', wires: [['out']] },
            { id: 'out', type: 'helper' }
        ];
        const credentials = { c1: { apiKey: 'test-key' } };

        nock('https://enrichlayer.com')
            .get('/api/v2/job')
            .query(true)
            .reply(404, { message: 'Not found' });

        helper.load([configNode, jobNode], flow, credentials, function () {
            const n1 = helper.getNode('n1');
            n1.on('call:error', function (call) {
                call.firstArg.message.should.containEql('404');
                done();
            });
            n1.receive({ payload: { url: 'https://linkedin.com/jobs/view/999' } });
        });
    });
});

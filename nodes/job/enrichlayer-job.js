const { makeRequest } = require('../../lib/api');

module.exports = function (RED) {
    function EnrichLayerJobNode(config) {
        RED.nodes.createNode(this, config);
        this.config = RED.nodes.getNode(config.config);
        this.operation = config.operation;
        const node = this;

        const staticProps = {
            url: config.url,
            search_id: config.search_id,
            job_type: config.job_type,
            experience_level: config.experience_level,
            when: config.when,
            flexibility: config.flexibility,
            geo_id: config.geo_id,
            keyword: config.keyword,
        };

        node.on('input', async function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments); };
            done = done || function (err) { if (err) node.error(err, msg); };

            if (!node.config) {
                node.status({ fill: 'red', shape: 'ring', text: 'missing config' });
                done(new Error('Enrich Layer config not set'));
                return;
            }

            const operation = msg.operation || node.operation;
            const p = msg.payload || {};
            const get = (key) => p[key] || staticProps[key] || '';

            const params = {};
            let path = '';

            try {
                switch (operation) {
                    case 'getJobProfile':
                        path = '/api/v2/job';
                        params.url = get('url');
                        break;

                    case 'searchJobs':
                        path = '/api/v2/company/job';
                        if (get('search_id')) params.search_id = get('search_id');
                        if (get('job_type')) params.job_type = get('job_type');
                        if (get('experience_level')) params.experience_level = get('experience_level');
                        if (get('when')) params.when = get('when');
                        if (get('flexibility')) params.flexibility = get('flexibility');
                        if (get('geo_id')) params.geo_id = get('geo_id');
                        if (get('keyword')) params.keyword = get('keyword');
                        break;

                    case 'getJobCount':
                        path = '/api/v2/company/job/count';
                        if (get('search_id')) params.search_id = get('search_id');
                        if (get('job_type')) params.job_type = get('job_type');
                        if (get('experience_level')) params.experience_level = get('experience_level');
                        if (get('when')) params.when = get('when');
                        if (get('flexibility')) params.flexibility = get('flexibility');
                        if (get('geo_id')) params.geo_id = get('geo_id');
                        if (get('keyword')) params.keyword = get('keyword');
                        break;

                    default:
                        throw new Error(`Unknown operation: ${operation}`);
                }

                node.status({ fill: 'blue', shape: 'dot', text: 'requesting...' });
                const result = await makeRequest(node.config, path, params);
                msg.payload = result;
                node.status({ fill: 'green', shape: 'dot', text: 'success' });
                send(msg);
                done();
            } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: err.message.substring(0, 32) });
                done(err);
            }
        });
    }

    RED.nodes.registerType('enrichlayer-job', EnrichLayerJobNode);
};

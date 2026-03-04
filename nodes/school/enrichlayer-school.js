const { makeRequest } = require('../../lib/api');

module.exports = function (RED) {
    function EnrichLayerSchoolNode(config) {
        RED.nodes.createNode(this, config);
        this.config = RED.nodes.getNode(config.config);
        this.operation = config.operation;
        const node = this;

        const staticProps = {
            url: config.url,
            school_url: config.school_url,
            use_cache: config.use_cache,
            live_fetch: config.live_fetch,
            boolean_search_keyword: config.boolean_search_keyword,
            country: config.country,
            enrich_profiles: config.enrich_profiles,
            page_size: config.page_size,
            resolve_numeric_id: config.resolve_numeric_id,
            sort_by: config.sort_by,
            student_status: config.student_status,
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
                    case 'getSchoolProfile':
                        path = '/api/v2/school';
                        params.url = get('url');
                        if (get('use_cache')) params.use_cache = get('use_cache');
                        if (get('live_fetch')) params.live_fetch = get('live_fetch');
                        break;

                    case 'listStudents':
                        path = '/api/v2/school/students/';
                        params.school_url = get('school_url');
                        if (get('boolean_search_keyword')) params.boolean_search_keyword = get('boolean_search_keyword');
                        if (get('country')) params.country = get('country');
                        if (get('enrich_profiles')) params.enrich_profiles = get('enrich_profiles');
                        if (get('page_size')) params.page_size = get('page_size');
                        if (get('resolve_numeric_id')) params.resolve_numeric_id = get('resolve_numeric_id');
                        if (get('sort_by')) params.sort_by = get('sort_by');
                        if (get('student_status')) params.student_status = get('student_status');
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

    RED.nodes.registerType('enrichlayer-school', EnrichLayerSchoolNode);
};

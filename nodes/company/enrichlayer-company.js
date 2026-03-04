const { makeRequest } = require('../../lib/api');

module.exports = function (RED) {
    function EnrichLayerCompanyNode(config) {
        RED.nodes.createNode(this, config);
        this.config = RED.nodes.getNode(config.config);
        this.operation = config.operation;
        const node = this;

        // Static config values (used as defaults when msg.payload doesn't provide them)
        const staticProps = {
            url: config.url,
            company_domain: config.company_domain,
            company_name: config.company_name,
            id: config.id,
            company_profile_url: config.company_profile_url,
            keyword_boolean: config.keyword_boolean,
            categories: config.categories,
            funding_data: config.funding_data,
            exit_data: config.exit_data,
            acquisitions: config.acquisitions,
            extra: config.extra,
            use_cache: config.use_cache,
            company_location: config.company_location,
            enrich_profile: config.enrich_profile,
            enrich_profiles: config.enrich_profiles,
            boolean_role_search: config.boolean_role_search,
            coy_name_match: config.coy_name_match,
            country: config.country,
            employment_status: config.employment_status,
            page_size: config.page_size,
            resolve_numeric_id: config.resolve_numeric_id,
            sort_by: config.sort_by,
            at_date: config.at_date,
            estimated_employee_count: config.estimated_employee_count,
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

            // Merge: msg.payload values take precedence over static config
            const get = (key) => p[key] || staticProps[key] || '';

            const params = {};
            let path = '';

            try {
                switch (operation) {
                    case 'getCompanyProfile':
                        path = '/api/v2/company';
                        params.url = get('url');
                        if (get('categories')) params.categories = get('categories');
                        if (get('funding_data')) params.funding_data = get('funding_data');
                        if (get('exit_data')) params.exit_data = get('exit_data');
                        if (get('acquisitions')) params.acquisitions = get('acquisitions');
                        if (get('extra')) params.extra = get('extra');
                        if (get('use_cache')) params.use_cache = get('use_cache');
                        break;

                    case 'lookupCompany':
                        path = '/api/v2/company/resolve';
                        if (get('company_domain')) params.company_domain = get('company_domain');
                        if (get('company_name')) params.company_name = get('company_name');
                        if (get('company_location')) params.company_location = get('company_location');
                        if (get('enrich_profile')) params.enrich_profile = get('enrich_profile');
                        break;

                    case 'lookupCompanyById':
                        path = '/api/v2/company/resolve-id';
                        params.id = get('id');
                        break;

                    case 'getCompanyProfilePicture':
                        path = '/api/v2/company/profile-picture';
                        params.company_profile_url = get('company_profile_url');
                        break;

                    case 'listEmployees':
                        path = '/api/v2/company/employees/';
                        params.url = get('url');
                        if (get('boolean_role_search')) params.boolean_role_search = get('boolean_role_search');
                        if (get('coy_name_match')) params.coy_name_match = get('coy_name_match');
                        if (get('country')) params.country = get('country');
                        if (get('employment_status')) params.employment_status = get('employment_status');
                        if (get('enrich_profiles')) params.enrich_profiles = get('enrich_profiles');
                        if (get('page_size')) params.page_size = get('page_size');
                        if (get('resolve_numeric_id')) params.resolve_numeric_id = get('resolve_numeric_id');
                        if (get('sort_by')) params.sort_by = get('sort_by');
                        if (get('use_cache')) params.use_cache = get('use_cache');
                        break;

                    case 'getEmployeeCount':
                        path = '/api/v2/company/employees/count';
                        params.url = get('url');
                        if (get('at_date')) params.at_date = get('at_date');
                        if (get('coy_name_match')) params.coy_name_match = get('coy_name_match');
                        if (get('employment_status')) params.employment_status = get('employment_status');
                        if (get('estimated_employee_count')) params.estimated_employee_count = get('estimated_employee_count');
                        if (get('use_cache')) params.use_cache = get('use_cache');
                        break;

                    case 'searchEmployees':
                        path = '/api/v2/company/employee/search/';
                        params.company_profile_url = get('company_profile_url');
                        params.keyword_boolean = get('keyword_boolean');
                        if (get('country')) params.country = get('country');
                        if (get('enrich_profiles')) params.enrich_profiles = get('enrich_profiles');
                        if (get('page_size')) params.page_size = get('page_size');
                        if (get('resolve_numeric_id')) params.resolve_numeric_id = get('resolve_numeric_id');
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

    RED.nodes.registerType('enrichlayer-company', EnrichLayerCompanyNode);
};

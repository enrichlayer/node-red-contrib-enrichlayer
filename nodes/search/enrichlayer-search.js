const { makeRequest } = require('../../lib/api');

module.exports = function (RED) {
    function EnrichLayerSearchNode(config) {
        RED.nodes.createNode(this, config);
        this.config = RED.nodes.getNode(config.config);
        this.operation = config.operation;
        const node = this;

        const staticProps = {
            country: config.country,
            region: config.region,
            city: config.city,
            company_type: config.company_type,
            follower_count_min: config.follower_count_min,
            follower_count_max: config.follower_count_max,
            name_search: config.name_search,
            industry: config.industry,
            primary_industry: config.primary_industry,
            specialities: config.specialities,
            employee_count_category: config.employee_count_category,
            employee_count_min: config.employee_count_min,
            employee_count_max: config.employee_count_max,
            description_search: config.description_search,
            founded_after_year: config.founded_after_year,
            founded_before_year: config.founded_before_year,
            funding_amount_min: config.funding_amount_min,
            funding_amount_max: config.funding_amount_max,
            funding_raised_after: config.funding_raised_after,
            funding_raised_before: config.funding_raised_before,
            page_size: config.page_size,
            enrich_profiles: config.enrich_profiles,
            use_cache: config.use_cache,
            first_name: config.first_name,
            last_name: config.last_name,
            education_field_of_study: config.education_field_of_study,
            education_degree_name: config.education_degree_name,
            education_school_name: config.education_school_name,
            education_school_profile_url: config.education_school_profile_url,
            current_role_title: config.current_role_title,
            past_role_title: config.past_role_title,
            current_role_before: config.current_role_before,
            current_role_after: config.current_role_after,
            current_company_profile_url: config.current_company_profile_url,
            past_company_profile_url: config.past_company_profile_url,
            current_job_description: config.current_job_description,
            past_job_description: config.past_job_description,
            current_company_name: config.current_company_name,
            past_company_name: config.past_company_name,
            groups: config.groups,
            languages: config.languages,
            headline: config.headline,
            summary: config.summary,
            industries: config.industries,
            interests: config.interests,
            skills: config.skills,
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
                    case 'searchCompanies':
                        path = '/api/v2/search/company';
                        ['country', 'region', 'city', 'follower_count_min',
                         'follower_count_max', 'industry', 'primary_industry',
                         'specialities', 'employee_count_category', 'employee_count_min',
                         'employee_count_max', 'founded_after_year',
                         'founded_before_year', 'funding_amount_min', 'funding_amount_max',
                         'funding_raised_after', 'funding_raised_before', 'page_size',
                         'enrich_profiles', 'use_cache'].forEach(function (key) {
                            if (get(key)) params[key] = get(key);
                        });
                        // These use renamed config keys to avoid Node-RED reserved props
                        if (get('company_type')) params.type = get('company_type');
                        if (get('name_search')) params.name = get('name_search');
                        if (get('description_search')) params.description = get('description_search');
                        break;

                    case 'searchPeople':
                        path = '/api/v2/search/person';
                        ['country', 'first_name', 'last_name', 'education_field_of_study',
                         'education_degree_name', 'education_school_name',
                         'education_school_profile_url', 'current_role_title',
                         'past_role_title', 'current_role_before', 'current_role_after',
                         'current_company_profile_url', 'past_company_profile_url',
                         'current_job_description', 'past_job_description',
                         'current_company_name', 'past_company_name', 'groups',
                         'languages', 'region', 'city', 'headline', 'summary',
                         'industries', 'interests', 'skills', 'page_size',
                         'enrich_profiles', 'use_cache'].forEach(function (key) {
                            if (get(key)) params[key] = get(key);
                        });
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

    RED.nodes.registerType('enrichlayer-search', EnrichLayerSearchNode);
};

const { makeRequest } = require('../../lib/api');

module.exports = function (RED) {
    function EnrichLayerPersonNode(config) {
        RED.nodes.createNode(this, config);
        this.config = RED.nodes.getNode(config.config);
        this.operation = config.operation;
        const node = this;

        const staticProps = {
            profile_url: config.profile_url,
            twitter_profile_url: config.twitter_profile_url,
            facebook_profile_url: config.facebook_profile_url,
            first_name: config.first_name,
            company_domain: config.company_domain,
            last_name: config.last_name,
            title: config.title,
            location: config.location,
            similarity_checks: config.similarity_checks,
            enrich_profile: config.enrich_profile,
            person_profile_url: config.person_profile_url,
            company_name: config.company_name,
            role: config.role,
            extra: config.extra,
            personal_contact_number: config.personal_contact_number,
            personal_email: config.personal_email,
            skills: config.skills,
            use_cache: config.use_cache,
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
                    case 'getPersonProfile':
                        path = '/api/v2/profile';
                        if (get('profile_url')) params.profile_url = get('profile_url');
                        else if (get('twitter_profile_url')) params.twitter_profile_url = get('twitter_profile_url');
                        else if (get('facebook_profile_url')) params.facebook_profile_url = get('facebook_profile_url');
                        if (get('extra')) params.extra = get('extra');
                        if (get('personal_contact_number')) params.personal_contact_number = get('personal_contact_number');
                        if (get('personal_email')) params.personal_email = get('personal_email');
                        if (get('skills')) params.skills = get('skills');
                        if (get('use_cache')) params.use_cache = get('use_cache');
                        break;

                    case 'lookupPerson':
                        path = '/api/v2/profile/resolve';
                        params.first_name = get('first_name');
                        params.company_domain = get('company_domain');
                        if (get('last_name')) params.last_name = get('last_name');
                        if (get('title')) params.title = get('title');
                        if (get('location')) params.location = get('location');
                        if (get('similarity_checks')) params.similarity_checks = get('similarity_checks');
                        if (get('enrich_profile')) params.enrich_profile = get('enrich_profile');
                        break;

                    case 'getPersonProfilePicture':
                        path = '/api/v2/person/profile-picture';
                        params.person_profile_url = get('person_profile_url');
                        break;

                    case 'lookupRole':
                        path = '/api/v2/find/company/role/';
                        params.company_name = get('company_name');
                        params.role = get('role');
                        if (get('enrich_profile')) params.enrich_profile = get('enrich_profile');
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

    RED.nodes.registerType('enrichlayer-person', EnrichLayerPersonNode);
};

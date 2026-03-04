const { makeRequest } = require('../../lib/api');

module.exports = function (RED) {
    function EnrichLayerContactNode(config) {
        RED.nodes.createNode(this, config);
        this.config = RED.nodes.getNode(config.config);
        this.operation = config.operation;
        const node = this;

        const staticProps = {
            email: config.email,
            phone_number: config.phone_number,
            profile_url: config.profile_url,
            twitter_profile_url: config.twitter_profile_url,
            facebook_profile_url: config.facebook_profile_url,
            lookup_depth: config.lookup_depth,
            enrich_profile: config.enrich_profile,
            callback_url: config.callback_url,
            page_size: config.page_size,
            email_validation: config.email_validation,
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
                    case 'reverseEmailLookup':
                        path = '/api/v2/profile/resolve/email';
                        params.email = get('email');
                        if (get('lookup_depth')) params.lookup_depth = get('lookup_depth');
                        if (get('enrich_profile')) params.enrich_profile = get('enrich_profile');
                        break;

                    case 'reversePhoneLookup':
                        path = '/api/v2/resolve/phone';
                        params.phone_number = get('phone_number');
                        break;

                    case 'lookupWorkEmail':
                        path = '/api/v2/profile/email';
                        params.profile_url = get('profile_url');
                        if (get('callback_url')) params.callback_url = get('callback_url');
                        break;

                    case 'getPersonalContact':
                        path = '/api/v2/contact-api/personal-contact';
                        if (get('profile_url')) params.profile_url = get('profile_url');
                        if (get('twitter_profile_url')) params.twitter_profile_url = get('twitter_profile_url');
                        if (get('facebook_profile_url')) params.facebook_profile_url = get('facebook_profile_url');
                        if (get('page_size')) params.page_size = get('page_size');
                        break;

                    case 'getPersonalEmail':
                        path = '/api/v2/contact-api/personal-email';
                        if (get('profile_url')) params.profile_url = get('profile_url');
                        if (get('twitter_profile_url')) params.twitter_profile_url = get('twitter_profile_url');
                        if (get('facebook_profile_url')) params.facebook_profile_url = get('facebook_profile_url');
                        if (get('email_validation')) params.email_validation = get('email_validation');
                        if (get('page_size')) params.page_size = get('page_size');
                        break;

                    case 'checkDisposableEmail':
                        path = '/api/v2/disposable-email';
                        params.email = get('email');
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

    RED.nodes.registerType('enrichlayer-contact', EnrichLayerContactNode);
};

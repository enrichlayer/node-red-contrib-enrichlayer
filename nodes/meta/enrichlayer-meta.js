const { makeRequest } = require('../../lib/api');

module.exports = function (RED) {
    function EnrichLayerMetaNode(config) {
        RED.nodes.createNode(this, config);
        this.config = RED.nodes.getNode(config.config);
        this.operation = config.operation;
        const node = this;

        node.on('input', async function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments); };
            done = done || function (err) { if (err) node.error(err, msg); };

            if (!node.config) {
                node.status({ fill: 'red', shape: 'ring', text: 'missing config' });
                done(new Error('Enrich Layer config not set'));
                return;
            }

            const operation = msg.operation || node.operation;

            try {
                switch (operation) {
                    case 'getCreditBalance':
                        node.status({ fill: 'blue', shape: 'dot', text: 'requesting...' });
                        const result = await makeRequest(node.config, '/api/v2/credit-balance', {});
                        msg.payload = result;
                        node.status({ fill: 'green', shape: 'dot', text: 'success' });
                        send(msg);
                        done();
                        break;

                    default:
                        throw new Error(`Unknown operation: ${operation}`);
                }
            } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: err.message.substring(0, 32) });
                done(err);
            }
        });
    }

    RED.nodes.registerType('enrichlayer-meta', EnrichLayerMetaNode);
};

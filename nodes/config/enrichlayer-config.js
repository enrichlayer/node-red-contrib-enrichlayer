module.exports = function (RED) {
    function EnrichLayerConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.baseUrl = config.baseUrl || 'https://enrichlayer.com';
        this.credentials = this.credentials || {};
    }

    RED.nodes.registerType('enrichlayer-config', EnrichLayerConfigNode, {
        credentials: {
            apiKey: { type: 'password' },
        },
    });
};

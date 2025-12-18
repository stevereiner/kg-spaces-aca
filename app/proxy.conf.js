const { BASE_URL, GRAPHRAG_URL } = process.env;
console.log('Using backend URL: ' + (BASE_URL || 'unknown'));
console.log('Using GraphRAG URL: ' + (GRAPHRAG_URL || 'http://localhost:8000'));

module.exports = {
  '/alfresco': {
    target: BASE_URL,
    secure: false,
    pathRewrite: {
      '^/alfresco/alfresco': ''
    },
    changeOrigin: true,
    onProxyReq: (request) => {
      if (request['method'] !== 'GET') {
        request.setHeader('origin', BASE_URL);
      }
    }
  },
  '/api': {
    target: GRAPHRAG_URL || 'http://localhost:8000',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  }
};

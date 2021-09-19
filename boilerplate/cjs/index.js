const { createServer } = require('http');

const app = require('./config/app')();
const env = require('./config/env');
const server = createServer(app);

server.listen(env.PORT, () => console.log(`server is running at http://localhost:${env.PORT} (${env.NODE_ENV})`));
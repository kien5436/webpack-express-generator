import { createServer } from 'http';

import app from './config/app';
import { PORT, NODE_ENV } from './config/env';

const server = createServer(app());

server.listen(PORT, () => console.log(`server is running at http://localhost:${PORT} (${NODE_ENV})`));
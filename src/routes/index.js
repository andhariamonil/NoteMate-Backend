const { Router } = require('express');
const { healthRoute } = require('./health/index');
const { authRoute } = require('./auth/index'); 
const { noteRoute } = require('./note/index');
const { aiRoute } = require('./ai/index');

const routes = Router();
routes.use(healthRoute);
routes.use(authRoute);
routes.use(noteRoute);
routes.use(aiRoute);

module.exports = { routes };

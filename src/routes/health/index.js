const { Router } = require('express');
const { healthController } = require('../../controller/health/index');

const healthRoute = Router();

healthRoute.get('/health', healthController);
module.exports = { healthRoute };
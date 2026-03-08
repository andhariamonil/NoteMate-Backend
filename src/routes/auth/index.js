const { Router } = require('express');
const { signUpController,signInController } = require('../../controller/auth/index');
const authRoute = Router();
authRoute.post('/sign-up', signUpController);
authRoute.post('/sign-in', signInController); 
module.exports = { authRoute };

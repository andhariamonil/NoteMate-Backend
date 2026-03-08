const { app } = require('./app');
const { routes } = require('./routes/index');

const {config}=require('dotenv');
config();

app.use(routes);
app.use((err, req, res, next) => {
  res.status(500).json({ message: err });
});
const port=process.env.SERVER_PORT;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${port}`);
});
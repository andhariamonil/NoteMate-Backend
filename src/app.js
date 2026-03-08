const express=require("express");
const cors = require('cors');
const app=express();
require("dotenv").config();


// OR if you want to allow only your frontend (for example: http://localhost:5173)
app.use(cors({
  origin: 'http://localhost:5173', // replace with your frontend URL
  credentials: true // if you're using cookies or sessions
}));

app.use(express.json());
app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
module.exports={app};

// const express = require('express')
// const app = express()
// const port = 3000

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })

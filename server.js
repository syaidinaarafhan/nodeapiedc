const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");

const app = express();

app.use(cors());

app.use(express.json());

app.use(cookieParser());


dotenv.config();

const PORT = process.env.PORT;


app.get('/',(req, res) => {
  res.send('Hello World')
});

const transaksiController = require('./src/transaksi/transaksi.controller')

app.use('/transaksis',transaksiController)

app.listen(PORT, () => {
  console.log(`App listening to http://localhost:${PORT}`);
})


require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const cookieParser = require('cookie-parser');
const connectDB = require('./db/db');
connectDB();

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(morgan('dev'));

app.get("/",(req,res)=>{
  res.send("Hello");
})
app.use(cookieParser());
app.use(authRoutes);
app.use(userRoutes);

app.listen(process.env.PORT,()=>{
  console.log(`Port is running ${process.env.PORT}`)
})
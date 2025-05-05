const express = require('express');
const app = express();
const PORT = 3001;
const connectDB = require('./Database/connection'); 
const dotenv = require('dotenv');
dotenv.config();

if (!process.env.JWT_SECRET) {
	console.error('JWT_SECRET environment variable is not defined');
	process.exit(1);
  }
// Middleware
app.use(express.json());


// MongoDB bağlantısı
connectDB();
// Routes
app.get('/', (req, res) => {
	res.send('Hello, World!');
});

const authRoutes = require('./Routes/Login'); // Adjust the path as necessary
app.use('/auth', authRoutes);
const prods = require('./Routes/products'); // Adjust the path as necessary
app.use('/prods', prods);


// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

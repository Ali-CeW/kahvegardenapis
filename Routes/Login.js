const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Enums = require('../config/enum'); // Assuming you have an Enums file for user types
const authenticateToken = require('../middleware/AuthMid'); // Middleware for token authentication
const Admin = require('../Database/Db/Admins'); // Import the Admin model

router.post('/login', async (req, res) => {
    const { name, password } = req.body;

    try {
        const admin = await Admin.findOne({ name });
        if (!admin) {
            return res.status(Enums.HTTP_CODES.UNAUTHORIZED).json({ message: 'Kullanıcı adı veya şifre hatalı' });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(Enums.HTTP_CODES.UNAUTHORIZED).json({ message: 'Kullanıcı adı veya şifre hatalı' });
        }
        const token = jwt.sign({ id: admin._id, user_type: "Admin"}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
        res.status(Enums.HTTP_CODES.OK).json({ token, user_type: "Admin", message: 'Giriş başarılı' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(Enums.HTTP_CODES.INTERNAL_SERVER_ERROR).json({ message: 'Sunucu hatası' });
    }
});


module.exports = router;

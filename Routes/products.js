const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Enums = require('../config/enum'); // Assuming you have an Enums file for user types
const authenticateToken = require('../middleware/AuthMid'); // Middleware for token authentication
const Cloudinary = require('../cloudinary/CloudConfig'); // Cloudinary config
const product = require('../Database/Db/products'); // Import the Product model
const fileUpload = require('express-fileupload'); // File upload middleware

// Add middleware to parse JSON request bodies
router.use(express.json());
router.use(fileUpload({
    useTempFiles: true, // Enable temporary file storage
    tempFileDir: '/tmp/' // Specify a directory for temporary files
}));

router.post('/createproduct', authenticateToken, async (req, res) => {
    try {
        const { name, description, price, category, isNewProduct, rating, reviewCount } = req.body;
        const file = req.files?.image;

        // Validate required fields
        if (!file) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Dosya bulunamadı' });
        }
        if (!name || !description || !price || !category || isNewProduct === undefined || rating === undefined || reviewCount === undefined) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Tüm alanları doldurmalısınız' });
        }
        if (isNewProduct !== 'true' && isNewProduct !== 'false') {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'isNewProduct alanı true veya false olmalıdır' });
        }
        if (isNaN(price) || price <= 0) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Geçerli bir fiyat giriniz' });
        }
        if (isNaN(rating) || rating < 0 || rating > 5) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Geçerli bir puan giriniz (0-5 arası)' });
        }
        if (isNaN(reviewCount) || reviewCount < 0) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Geçerli bir yorum sayısı giriniz' });
        }

        // Validate file size and type
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Dosya boyutu çok büyük' });
        }
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Geçersiz dosya türü. Sadece JPEG ve PNG kabul edilir' });
        }

        // Upload file to Cloudinary
        const result = await Cloudinary.uploader.upload(file.tempFilePath, {
            filename: file.name,
            resource_type: "image",
            folder: "aek_kafe_img",
        });

        // Create and save the new product
        const newProduct = new product({
            name,
            description,
            price,
            category,
            imageUrl: result.secure_url,
            isNew: isNewProduct === 'true', // Convert string to boolean
            rating,
            reviewCount
        });
        await newProduct.save();

        res.status(Enums.HTTP_CODES.CREATED).json({ message: 'Ürün başarıyla eklendi!' });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(Enums.HTTP_CODES.INTERNAL_SERVER_ERROR).json({ message: 'Sunucu hatası' });
    }
});

router.get('/getproducts', authenticateToken, async (req, res) => {
    try {
        const productsList = await product.find({});
        res.status(Enums.HTTP_CODES.OK).json({ message: 'Ürünler başarıyla alındı!', items: productsList });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(Enums.HTTP_CODES.INTERNAL_SERVER_ERROR).json({ message: 'Sunucu hatası' });
    }
});

// New endpoints for Admin Actions

// Get product by ID
router.get('/getproduct/:id',   authenticateToken, async (req, res) => {
    try {
        const productItem = await product.findById(req.params.id);
        
        if (!productItem) {
            return res.status(Enums.HTTP_CODES.NOT_FOUND).json({ message: 'Ürün bulunamadı' });
        }
        
        res.status(Enums.HTTP_CODES.OK).json({ message: 'Ürün başarıyla alındı', item: productItem });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(Enums.HTTP_CODES.INTERNAL_SERVER_ERROR).json({ message: 'Sunucu hatası' });
    }
});

// Update product
router.put('/updateproduct/:id', authenticateToken, async (req, res) => {
    try {
        const { name, description, price, category, isNewProduct, rating, reviewCount } = req.body;
        const file = req.files?.image;

        // Check if the product exists
        const existingProduct = await product.findById(req.params.id);
        if (!existingProduct) {
            return res.status(Enums.HTTP_CODES.NOT_FOUND).json({ message: 'Ürün bulunamadı' });
        }
        
        // Validate required fields
        if (!name || !description || !price || !category || isNewProduct === undefined || rating === undefined || reviewCount === undefined) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Tüm alanları doldurmalısınız' });
        }
        
        if (isNewProduct !== 'true' && isNewProduct !== 'false') {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'isNewProduct alanı true veya false olmalıdır' });
        }
        
        if (isNaN(price) || price <= 0) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Geçerli bir fiyat giriniz' });
        }
        
        if (isNaN(rating) || rating < 0 || rating > 5) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Geçerli bir puan giriniz (0-5 arası)' });
        }
        
        if (isNaN(reviewCount) || reviewCount < 0) {
            return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Geçerli bir yorum sayısı giriniz' });
        }

        // Create update object
        const updateData = {
            name,
            description,
            price,
            category,
            isNew: isNewProduct === 'true',
            rating,
            reviewCount
        };
        
        // If a new image is provided, upload it to Cloudinary
        if (file) {
            // Validate file size and type
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Dosya boyutu çok büyük' });
            }
            
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return res.status(Enums.HTTP_CODES.BAD_REQUEST).json({ message: 'Geçersiz dosya türü. Sadece JPEG ve PNG kabul edilir' });
            }
            
            // Upload file to Cloudinary
            const result = await Cloudinary.uploader.upload(file.tempFilePath, {
                filename: file.name,
                resource_type: "image",
                folder: "aek_kafe_img",
            });
            
            // Add the new image URL to the update data
            updateData.imageUrl = result.secure_url;
        }
        
        // Update the product
        const updatedProduct = await product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        
        res.status(Enums.HTTP_CODES.OK).json({ message: 'Ürün başarıyla güncellendi!', item: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(Enums.HTTP_CODES.INTERNAL_SERVER_ERROR).json({ message: 'Sunucu hatası' });
    }
});

// Delete product
router.delete('/deleteproduct/:id', authenticateToken, async (req, res) => {
    try {
        const deletedProduct = await product.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(Enums.HTTP_CODES.NOT_FOUND).json({ message: 'Ürün bulunamadı' });
        }
        
        res.status(Enums.HTTP_CODES.OK).json({ message: 'Ürün başarıyla silindi!' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(Enums.HTTP_CODES.INTERNAL_SERVER_ERROR).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
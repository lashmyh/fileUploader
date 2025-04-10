const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const fs = require('fs').promises; 
const multer = require('multer');
const supabase = require('../supabaseClient');
const logger = require('../utils/logger');

const upload = multer({ dest: 'temp/' });

// Upload file
router.post('/', upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const folderId = parseInt(req.body.folderId);
        const userId = req.user.id; 
        const filePath = req.file.path;
        const fileName = `${Date.now()}-${req.file.originalname}`;

        //check if folderId is valid for the user
        const folder = await prisma.folder.findUnique({
            where: { id: folderId, userId }
        });
        if (!folder) {
            return res.status(403).send('Unauthorized folder.');
        }

        //read file from temp folder using async
        const fileReader = await fs.readFile(filePath);

        //upload file to Supabase
        const { data, error } = await supabase.storage
            .from('files')
            .upload(fileName, fileReader, {
                contentType: req.file.mimetype,
            });

        //delete the temporary file asynchronously
        await fs.unlink(filePath);

        if (error) {
            logger.error('Supabase upload error: ' + error.message);
            return res.status(500).send('Error uploading file to Supabase');
        }

        //add file record to database
        const fileRecord = await prisma.file.create({
            data: {
                filename: fileName,
                folderId,
                url: data.path, 
                size: req.file.size,
                userId,
                mimetype: req.file.mimetype,
            },
        });

        res.redirect(`/folders/${folderId}`);

    } catch (error) {
        logger.error('File upload error: ' + error.message);
        res.status(500).send('An error occurred while uploading the file.');
    }
});

module.exports = router;

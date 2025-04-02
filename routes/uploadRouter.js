const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const fs = require('fs');
const multer = require('multer');
const supabase = require('../supabaseClient');

const upload = multer({dest: 'temp/'});


//upload 
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

        //read file from temp folder
        const fileReader = fs.readFileSync(filePath);

        //upload file to supabase
        const { data, error } = await supabase.storage
            .from('files')
            .upload(fileName, fileReader, {
                contentType: req.file.mimetype,
            });

        //delete file from temp folder
        fs.unlinkSync(filePath);

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).send('Error uploading file to Supabase');
        }

        //add file to database 
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


    } catch (error){
        console.error('File upload error:', error);
        res.status(500).send('An error occurred while uploading the file.');
    }
});


module.exports = router;
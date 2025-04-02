const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const getSignedUrl = require('../utils/getSignedUrl');
const supabase = require('../supabaseClient');

const formatDate = require('../utils/formatDate');
const formatSize = require('../utils/formatSize');


router.get('/:id', async (req, res) => {
    try {
        const fileId = parseInt(req.params.id, 10);
        const folderId = parseInt(req.query.folderId, 10);


        if (!req.isAuthenticated()) {
            return res.redirect('/login');
        };


        const fileRecord = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId: req.user.id, 
                folderId: folderId, 
            },
        });

        if (!fileRecord) {
            return res.status(404).send('File not found.');
        }
        
    
        // generate a signed URL for the file
        const signedUrl = await getSignedUrl(fileRecord.url);

        console.log("your file", fileRecord);
        res.render('file', { file: fileRecord, signedUrl, formattedDate: formatDate(fileRecord.createdAt), formattedSize: formatSize(fileRecord.size) } );


    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).send('An error occurred while fetching the file.');
    }

})


router.post('/:id/delete', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    try {
        const fileId = parseInt(req.params.id, 10);
        const folderId = parseInt(req.query.folderId, 10); 

        //find the file to be deleted

        const fileRecord = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId: req.user.id, 
                folderId: folderId, 
            },
        });

        if (!fileRecord) {
            return res.status(404).send('File not found.');
        }

        // Delete the file from Supabase storage
        const { error } = await supabase.storage
            .from('files') 
            .remove([fileRecord.url]); 
        
        if (error) {
            console.error('Supabase delete error:', error);
            return res.status(500).send('Error deleting file from storage.');
        };

        await prisma.file.deleteMany({
            where: {
                id: fileId, 
                userId: req.user.id,
                folderId: folderId,
            },
        });
        
        console.log('File deleted successfully.');
        res.redirect(`/folders/${folderId}`); // Redirect back to the folder view
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).send('An error occurred while deleting the file.');
    }
});



module.exports = router
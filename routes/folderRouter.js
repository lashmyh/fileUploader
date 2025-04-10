const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const formatFolderWithFiles = require('../utils/formatFolder');
const logger = require('../utils/logger');



router.get('/', async(req, res) => {
    if (req.isAuthenticated()) {

        try {
            const userId = req.user?.id;
            const folders = await prisma.folder.findMany({
                where: { userId: userId },
            }); //get all folders

            res.render('folders', { user: req.user, folders });
        } catch (error) {
            logger.error('Error fetching folders: ' + error.message);
            res.status(500).send("An error occured while fetching the folders.");
        }

    } else {
      res.redirect('/login');
    }
});

router.post('/', async(req, res, next) => {
    try {
        const { folderName } = req.body;

        if (!folderName) {
        return res.status(400).send('A folder name is required');
        };

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).send('User must be authenticated');
        }

        // Check if a folder with the same name already exists for this user
        const existingFolder = await prisma.folder.findFirst({
            where: {
                userId: userId,
                name: folderName,
            },
        });

        if (existingFolder) {
            return res.status(400).send('Folder with this name already exists for the user');
        }

        // Create the folder
        const newFolder = await prisma.folder.create({
            data: {
                name: folderName,
                userId: userId,
            },
        });

        const folders = await prisma.folder.findMany({
            where: { userId: userId },
        }); //get all folders

        res.redirect('/folders');


    } catch (error) {
        logger.error('Error creating folder: ' + error.message);
        next(error);  
    }
});

router.post('/:id/delete', async(req, res) => {
    try {
        const folderId = Number(req.params.id);

        //check if folder exists
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
            include: { files: true }, // Include the related files
        });


        if (!folder) {
            return res.status(404).send('Folder not found.');
        }

        //check if folder is empty
        if (folder.files.length === 0) {
            await prisma.folder.delete({
                where: { id: folderId },
            });
            res.redirect('/folders')
        } else {
            
            return res.status(404).send('Folder not empty.');
        }

    }catch (error) {
        logger.error('Error deleting folder: ' + error.message);
        res.status(500).send('Error deleting folder');
    }
})

router.get('/:id', async (req, res) => {
    if (req.isAuthenticated()) {
      try {
        const folderId = parseInt(req.params.id); 
  
        const folderWithFiles = await prisma.folder.findUnique({
          where: { id: folderId },
          include: {
            files: true, 
          },
        });
  
        if (!folderWithFiles) {
          return res.status(404).send("Folder not found");
        }
    
        // Render the currentFolder view and pass the folder and files data
        
        res.render('currentFolder', {
          user: req.user,
          folder: formatFolderWithFiles(folderWithFiles),
        });
      } catch (error) {
        logger.error('Error fetching folder: ' + error.message);
        res.status(500).send("An error occurred while fetching the folder.");
      }
    } else {
        res.redirect('/login');
    }
  });

module.exports = router;

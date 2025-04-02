const formatDate = require('../utils/formatDate');
const formatSize = require('../utils/formatSize');

const formatFolderWithFiles = (folderWithFiles) => {
    

    // Map over the files to format `createdAt` and `size`
    const formattedFiles = folderWithFiles.files.map(file => ({
        ...file,
        createdAt: formatDate(file.createdAt),
        size: formatSize(file.size),
    }));

    // Return the formatted object
    return {
        ...folderWithFiles,
        files: formattedFiles,
    };
};

module.exports = formatFolderWithFiles;

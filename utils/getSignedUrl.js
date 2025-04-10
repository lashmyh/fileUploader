const supabase = require('../supabaseClient');
const logger = require('../utils/logger');


//get signed URL to access file from private supabase bucket
const getSignedUrl = async (filePath) => {
    const { data, error } = await supabase.storage
        .from('files')
        .createSignedUrl(filePath, 60 * 60); // URL valid for 1 hour 

    if (error) {
        logger.error('Error generating signed URL: ' + error.message);
        throw new Error(`Error generating signed URL: ${error.message}`);

    }

    return data.signedUrl;
};

module.exports = getSignedUrl;
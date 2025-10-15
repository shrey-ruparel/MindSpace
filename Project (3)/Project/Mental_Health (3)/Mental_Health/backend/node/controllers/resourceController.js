const Resource = require('../models/Resource');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const streamifier = require('streamifier');

// Helper function to determine resource type for Cloudinary
const getResourceType = (mimetype) => {
  if (mimetype.startsWith('video/')) {
    return 'video';
  }
  if (mimetype.startsWith('audio/')) {
    return 'video'; // Cloudinary handles audio under the 'video' resource type
  }
  if (mimetype.startsWith('image/')) {
    return 'image';
  }
  // For PDFs, documents, etc.
  return 'raw';
};

exports.createResource = async (req, res) => {
    try {
        const { title, description, category, type, tags } = req.body;
        const file = req.file;
        
        // Debug file object
        console.log("[Debug] File object:", {
            exists: !!file,
            mimetype: file?.mimetype,
            buffer: !!file?.buffer,
            size: file?.size
        });

        if (!file || !file.buffer) {
            return res.status(400).json({ error: "No file uploaded or file buffer is empty." });
        }

        // Detect file type using MIME type or extension
        let resourceType = "raw";
        const mime = file.mimetype || "";
        const ext = file.originalname.split('.').pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif"].includes(ext) || mime.startsWith("image/")) {
            resourceType = "image";
        } else if (["mp4", "mov", "avi", "mp3", "wav"].includes(ext) || mime.startsWith("video/") || mime.startsWith("audio/")) {
            resourceType = "video";
        }

        // Debug upload parameters
        console.log("[Debug] Upload parameters:", {
            resourceType,
            mimeType: mime,
            extension: ext,
            fileName: file.originalname
        });

        // Create a Promise to handle the upload
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                resource_type: resourceType,
                folder: "resources"
            }, (error, result) => {
                if (error) {
                    console.error("[Cloudinary Upload Error]", error);
                    reject(error);
                } else {
                    resolve(result);
                }
            });

            // Create read stream from buffer and handle errors
            const readStream = streamifier.createReadStream(file.buffer);
            readStream.on('error', (err) => {
                console.error("[Stream Error]", err);
                reject(err);
            });

            // Pipe with error handling
            readStream.pipe(uploadStream).on('error', (err) => {
                console.error("[Upload Stream Error]", err);
                reject(err);
            });
        });

        // Wait for upload to complete
        const result = await uploadPromise;
        
        // Save resource metadata to DB
        const newResource = new Resource({
            title,
            description,
            category,
            type,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            url: result.secure_url,
            fileType: resourceType,
            fileName: file.originalname
        });
        await newResource.save();
        res.status(201).json(newResource);
    } catch (err) {
        // Log detailed error information
        console.error("[Resource Upload Error]", {
            message: err.message,
            stack: err.stack,
            cloudinaryError: err.http_code ? true : false,
            details: err
        });

        // Handle Cloudinary-specific errors
        if (err.http_code) {
            return res.status(err.http_code).json({
                error: "Failed to upload to cloud storage: " + err.message,
                cloudinaryError: true
            });
        }

        // Handle Mongoose errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: "Invalid resource data",
                details: Object.values(err.errors).map(e => e.message)
            });
        }

        // Generic error response
        res.status(500).json({
            error: "Failed to create resource. Please try again.",
            details: err.message
        });
    }
};

// @desc    Edit resource details
// @route   PUT /admin/resources/edit/:id
// @access  Private (Admin)
exports.editResource = async (req, res) => {
    const { type, title, category, description, duration, rating, downloads, tags } = req.body;
    let file_url = req.body.file_url;
    let public_id = req.body.public_id;

    try {
        let resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        if (req.file) {
            if (resource.public_id) {
                // Determine resource type for deletion
                const resource_type_for_destroy = getResourceType(resource.file_url.includes('/video/') ? 'video/mp4' : resource.file_url.includes('/image/') ? 'image/jpeg' : 'application/pdf');
                await cloudinary.uploader.destroy(resource.public_id, { resource_type: resource_type_for_destroy });
            }

            const resource_type = getResourceType(req.file.mimetype);
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'resources', resource_type },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
            file_url = result.secure_url;
            public_id = result.public_id;
        }

        resource.type = type || resource.type;
        resource.title = title || resource.title;
        resource.description = description || resource.description;
        resource.category = category || resource.category;
        resource.duration = duration || resource.duration;
        resource.rating = rating || resource.rating;
        resource.downloads = downloads || resource.downloads;
        resource.tags = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : resource.tags;
        resource.file_url = file_url || resource.file_url;
        resource.public_id = public_id || resource.public_id;

        await resource.save();
        res.json(resource);
    } catch (err) {
        console.error('Error editing resource:', err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Increment download count for a resource
// @route   POST /api/resources/download/:id
// @access  Public
exports.increment_download_count = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        resource.downloads = (resource.downloads || 0) + 1;
        await resource.save();

        res.json({ msg: 'Download count updated.', downloads: resource.downloads });
    } catch (err) {
        console.error('Error incrementing download count:', err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Remove resource
// @route   DELETE /admin/resources/remove/:id
// @access  Private (Admin)
exports.removeResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        if (resource.public_id) {
            await cloudinary.uploader.destroy(resource.public_id);
        }

        await resource.deleteOne();
        res.json({ msg: 'Resource removed' });
    } catch (err) {
        console.error('Error deleting resource:', err.message);
        res.status(500).send('Server error');
    }
};

exports.getResources = async (req, res) => {
    try {
        const resources = await Resource.find().populate('user_id', 'name');
        if (!resources || resources.length === 0) {
            return res.status(404).json({ msg: 'No resources found' });
        }
        res.json(resources);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getResourceById = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.json(resource);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.downloadResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource || !resource.file_url) {
            return res.status(404).json({ msg: 'Resource or file not found' });
        }

        // Increment download count
        resource.downloads = (resource.downloads || 0) + 1;
        await resource.save();

        const fileUrl = resource.file_url;
        const fileName = fileUrl.split('/').pop();

        res.header('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // Use cloudinary.v2.utils.api_url to get a direct link
        const downloadUrl = cloudinary.url(resource.public_id, {
            flags: 'attachment'
        });

        res.redirect(downloadUrl);

    } catch (err) {
        console.error('Error downloading resource:', err.message);
        res.status(500).send('Server error');
    }
};

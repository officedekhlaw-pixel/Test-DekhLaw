/**
 * DekhLaw — Cloudinary Upload Middleware
 * Automatically uploads images to Cloudinary and returns a permanent URL.
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary from Env Vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ─── 1. Storage for Profile Photos ─────────────────────────────────────────────

const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dekhlaw/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// ─── 2. Storage for Verification Documents ─────────────────────────────────────

const docStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dekhlaw/docs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto' // Important for PDFs
  }
});

// ─── Multer Instances ─────────────────────────────────────────────────────────

const uploadProfile = multer({ storage: profileStorage }).single('profilePhoto');

// For lawyers, we need custom logic to handle two storage targets or just use profileStorage for both
// Since we have separate fields, we'll use a standard disk storage OR a unified Cloudinary one.
// Let's use a unified storage but different folders based on logic.

const unifiedStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isDoc = file.fieldname === 'verificationDoc';
    return {
      folder: isDoc ? 'dekhlaw/docs' : 'dekhlaw/profiles',
      allowed_formats: isDoc ? ['jpg', 'png', 'pdf'] : ['jpg', 'png', 'webp'],
      transformation: isDoc ? [] : [{ width: 500, height: 500, crop: 'fill' }]
    };
  }
});

const uploadLawyer = multer({ 
  storage: unifiedStorage,
  limits: { fileSize: 10 * 1024 * 1024 } 
}).fields([
  { name: 'profilePhoto',    maxCount: 1 },
  { name: 'verificationDoc', maxCount: 1 }
]);

// ─── Middleware Wrappers ───────────────────────────────────────────────────────

function handleUserUpload(req, res, next) {
  uploadProfile(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}

function handleLawyerUpload(req, res, next) {
  uploadLawyer(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}

module.exports = { handleUserUpload, handleLawyerUpload };

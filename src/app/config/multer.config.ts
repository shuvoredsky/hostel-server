import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary.config';

// Listing images এর জন্য storage
const listingStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dhakastay/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }],
  } as any,
});

// Profile image এর জন্য storage
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dhakastay/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  } as any,
});

// File filter — শুধু image accept করবে
const imageFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Listing upload — multiple images (max 5)
export const listingUpload = multer({
  storage: listingStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Profile upload — single image
export const profileUpload = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});


// Logo এর জন্য storage
const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dhakastay/site/logo',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 400, height: 400, crop: 'limit' }],
  } as any,
});

// Banner এর জন্য storage
const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dhakastay/site/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1920, height: 600, crop: 'limit' }],
  } as any,
});

export const logoUpload = multer({
  storage: logoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const bannerUpload = multer({
  storage: bannerStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
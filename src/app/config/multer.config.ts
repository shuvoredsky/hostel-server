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


// Student ID card এর জন্য storage
const studentIdStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dhakastay/student-id-cards',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
  } as any,
});

export const studentIdUpload = multer({
  storage: studentIdStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
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

// Banner Video এর জন্য storage
const bannerVideoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dhakastay/site/banners/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'mov'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  } as any,
});

const videoFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (MP4, WebM) are allowed'));
  }
};

export const bannerVideoUpload = multer({
  storage: bannerVideoStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

// Banner Media Storage (handles both poster image and video in multi-field upload)
const bannerMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: Express.Multer.File) => {
    if (file.mimetype.startsWith('video/')) {
      return {
        folder: 'dhakastay/site/banners/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'webm', 'mov'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      };
    }
    return {
      folder: 'dhakastay/site/banners',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1920, height: 600, crop: 'limit' }],
    };
  },
});

const bannerMediaFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

export const bannerMediaUpload = multer({
  storage: bannerMediaStorage,
  fileFilter: bannerMediaFileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});
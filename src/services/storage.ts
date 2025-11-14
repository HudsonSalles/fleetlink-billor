import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase';
import { DocumentFile } from '../types/entities';

/**
 * Storage service for uploading and managing files in Firebase Storage
 */

/**
 * Generate a unique filename with timestamp and random suffix
 */
const generateFileName = (originalName: string, basePath: string): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${basePath}/${timestamp}_${randomId}_${cleanName}`;
};

/**
 * Upload a single file to Firebase Storage
 */
export const uploadFile = async (
  file: File,
  basePath: string,
  onProgress?: (progress: number) => void
): Promise<DocumentFile> => {
  try {
    console.log('Starting file upload:', { fileName: file.name, basePath, size: file.size });
    
    const fullPath = generateFileName(file.name, basePath);
    const storageRef = ref(storage, fullPath);
    
    console.log('Generated file path:', fullPath);
    
    console.log('Storage ref created:', fullPath);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress + '%');
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error details:', {
            code: error.code,
            message: error.message,
            name: error.name,
            serverResponse: error.serverResponse
          });
          reject(error);
        },
        async () => {
          try {
            console.log('Upload completed, getting download URL...');
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL received:', downloadURL);
            
            const documentFile: DocumentFile = {
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
              name: file.name,
              url: downloadURL,
              type: file.type as 'image/jpeg' | 'image/png' | 'application/pdf',
              size: file.size,
              uploadedAt: new Date(),
            };
            
            console.log('Document file created:', documentFile);
            resolve(documentFile);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Firebase Storage
 */
export const uploadMultipleFiles = async (
  files: FileList,
  basePath: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<DocumentFile[]> => {
  try {
    const uploadPromises = Array.from(files).map((file, index) =>
      uploadFile(file, basePath, (progress) => {
        if (onProgress) {
          onProgress(index, progress);
        }
      })
    );
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple file upload failed:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('File deletion failed:', error);
    throw error;
  }
};

/**
 * Upload truck documents
 */
export const uploadTruckDocuments = async (
  files: FileList,
  truckId: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<DocumentFile[]> => {
  const basePath = `trucks/${truckId}/documents`;
  return uploadMultipleFiles(files, basePath, onProgress);
};

/**
 * Upload driver documents
 */
export const uploadDriverDocuments = async (
  files: FileList,
  driverId: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<DocumentFile[]> => {
  const basePath = `drivers/${driverId}/documents`;
  return uploadMultipleFiles(files, basePath, onProgress);
};

/**
 * Validate file before upload
 */
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only PDF, JPG, and PNG files are allowed' };
  }
  
  return { isValid: true };
};

/**
 * Validate multiple files before upload
 */
export const validateFiles = (files: FileList): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  Array.from(files).forEach((file, index) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
};
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'receipts/user123')
 * @returns The public download URL
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!file) throw new Error('No file provided');

    // Create a unique filename
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const fullPath = `${path}/${filename}`;

    const storageRef = ref(storage, fullPath);

    // Upload the file
    await uploadBytes(storageRef, file);

    // Get and return the download URL
    return await getDownloadURL(storageRef);
};

/**
 * Deletes a file from Firebase Storage given its URL or path.
 * @param urlOrPath The full download URL or the storage path
 */
export const deleteFile = async (urlOrPath: string): Promise<void> => {
    try {
        // If it's a full URL, we need to extract the path, 
        // or we can try to create a ref directly from the URL.
        const storageRef = ref(storage, urlOrPath);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting file:', error);
        // Might already be deleted or invalid path
    }
};

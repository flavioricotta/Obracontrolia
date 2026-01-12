/**
 * Image compression and WebP conversion utility
 * Reduces image size by ~60-80% while maintaining good quality
 */

interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1
}

const DEFAULT_OPTIONS: CompressOptions = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.75,
};

/**
 * Compresses and converts an image file to WebP format
 * @param file - Original image file
 * @param options - Compression options
 * @returns Promise with compressed WebP file
 */
export const compressImage = async (
    file: File,
    options: CompressOptions = {}
): Promise<File> => {
    const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            try {
                // Calculate new dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth!) {
                    height = Math.round((height * maxWidth!) / width);
                    width = maxWidth!;
                }

                if (height > maxHeight!) {
                    width = Math.round((width * maxHeight!) / height);
                    height = maxHeight!;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw image on canvas
                ctx?.drawImage(img, 0, 0, width, height);

                // Convert to WebP blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Create new file with WebP extension
                        const compressedFile = new File(
                            [blob],
                            file.name.replace(/\.[^.]+$/, '.webp'),
                            { type: 'image/webp' }
                        );

                        console.log(
                            `Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`
                        );

                        resolve(compressedFile);
                    },
                    'image/webp',
                    quality
                );
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        // Load image from file
        img.src = URL.createObjectURL(file);
    });
};

/**
 * Compresses multiple images in parallel
 */
export const compressImages = async (
    files: File[],
    options?: CompressOptions
): Promise<File[]> => {
    return Promise.all(files.map((file) => compressImage(file, options)));
};

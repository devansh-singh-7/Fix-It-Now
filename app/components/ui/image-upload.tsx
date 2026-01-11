"use client";

import { Button } from "@/app/components/ui/button";
import { useImageUpload } from "@/app/components/hooks/use-image-upload";
import { ImagePlus, X, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    images: File[];
    imagePreviews: string[];
    onImagesChange: (files: File[], previews: string[]) => void;
    maxFiles?: number;
    maxFileSize?: number;
    allowedTypes?: string[];
    error?: string;
    onError?: (message: string) => void;
}

export function ImageUpload({
    images,
    imagePreviews,
    onImagesChange,
    maxFiles = 5,
    maxFileSize = 5 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    onError,
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const {
        fileInputRef,
        handleThumbnailClick,
    } = useImageUpload({});

    const handleFileChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(event.target.files || []);
            processFiles(files);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [images, imagePreviews, maxFiles, maxFileSize, allowedTypes]
    );

    const processFiles = (files: File[]) => {
        if (files.length + images.length > maxFiles) {
            onError?.(`Maximum ${maxFiles} images allowed`);
            return;
        }

        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                onError?.(`Invalid file type: ${file.name}. Only JPG, PNG, and WebP allowed.`);
                continue;
            }

            if (file.size > maxFileSize) {
                onError?.(`File too large: ${file.name}. Maximum size is 5MB.`);
                continue;
            }

            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        }

        if (validFiles.length > 0) {
            onImagesChange([...images, ...validFiles], [...imagePreviews, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        onImagesChange(
            images.filter((_, i) => i !== index),
            imagePreviews.filter((_, i) => i !== index)
        );
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files).filter(file =>
                file.type.startsWith("image/")
            );
            processFiles(files);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [images, imagePreviews]
    );

    return (
        <div className="space-y-4">
            <input
                type="file"
                accept={allowedTypes.join(',')}
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                disabled={images.length >= maxFiles}
            />

            {/* Upload Zone */}
            <div
                onClick={handleThumbnailClick}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200",
                    isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800",
                    images.length >= maxFiles && "pointer-events-none opacity-50"
                )}
            >
                <div className="rounded-full bg-white dark:bg-gray-900 p-3 shadow-sm">
                    <ImagePlus className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 dark:text-blue-400">Click to select</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PNG, JPG, or WebP (max {maxFiles} files, 5MB each)
                    </p>
                </div>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((file, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                <Image
                                    src={imagePreviews[index]}
                                    alt={`Preview ${index + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(index);
                                        }}
                                        className="h-9 w-9 p-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {/* File name */}
                            <div className="mt-1.5 flex items-center gap-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                                    {file.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <X className="h-3.5 w-3.5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

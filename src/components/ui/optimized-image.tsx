'use client';

import Image, { ImageProps } from 'next/image';
import { useState, forwardRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
  skeletonClassName?: string;
}

const ImageSkeleton = ({ className }: { className?: string }) => (
  <div 
    className={cn(
      "animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md",
      className
    )}
  />
);

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({
    src,
    alt,
    fallbackSrc = '/images/placeholder.png',
    onLoad,
    onError,
    className,
    containerClassName,
    showSkeleton = true,
    skeletonClassName,
    quality = 85,
    ...props
  }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setHasError(true);
      setIsLoading(false);
      if (currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
      }
      onError?.();
    }, [currentSrc, fallbackSrc, onError]);

    return (
      <div className={cn("relative overflow-hidden", containerClassName)}>
        {isLoading && showSkeleton && (
          <ImageSkeleton 
            className={cn(
              "absolute inset-0 z-10",
              skeletonClassName
            )}
          />
        )}
        
        <Image
          ref={ref}
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          quality={quality}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            hasError && "opacity-50",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
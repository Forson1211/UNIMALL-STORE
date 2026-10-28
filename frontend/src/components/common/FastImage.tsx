import React, { useState, useRef, useEffect } from 'react';

interface FastImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL */
  src: string;
  /** Alt text – required for accessibility */
  alt: string;
  /** Extra class names to apply to the <img> element */
  className?: string;
  /** Extra class names to apply to the container <div> element */
  containerClassName?: string;
  /** Loading strategy: "eager" for above‑the‑fold images, "lazy" otherwise */
  loading?: 'eager' | 'lazy';
}

export const FastImage: React.FC<FastImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  loading = 'lazy',
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && (imgRef.current.complete || imgRef.current.naturalWidth > 0)) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div className={`relative ${containerClassName || 'w-full h-full'}`}>
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className={`${className} transition-opacity duration-150 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        {...rest}
      />
    </div>
  );
};

export default FastImage;

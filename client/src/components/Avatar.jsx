import React from 'react';

const Avatar = ({ 
  src, 
  alt = "avatar", 
  className = "w-8 h-8 rounded-full border", 
  fallbackSrc = '/default-avatar.svg',
  onClick,
  ...props 
}) => {
  // Normalize avatar source - handle null, undefined, empty string, and string 'null'
  const normalizedSrc = src && src !== 'null' && src.trim() !== '' ? src : fallbackSrc;

  const handleError = (e) => {
    if (e.currentTarget.src !== fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
      e.currentTarget.onerror = null; // Prevent infinite loop
    }
  };

  const handleLoad = (e) => {
    // If image loads but is broken/empty (0x0 dimensions), fallback to default
    if (e.target.naturalWidth === 0 || e.target.naturalHeight === 0) {
      e.target.src = fallbackSrc;
    }
  };

  const imgElement = (
    <img
      src={normalizedSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-full">
        {imgElement}
      </button>
    );
  }

  return imgElement;
};

export default Avatar;

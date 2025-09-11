import React, { useState } from 'react';

const ImageCarousel = ({ images = [], className = '', imgClassName = '' }) => {
  const validImages = (images || []).filter(Boolean);
  const [index, setIndex] = useState(0);

  if (validImages.length === 0) return null;

  const goPrev = (e) => {
    e?.stopPropagation?.();
    setIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const goNext = (e) => {
    e?.stopPropagation?.();
    setIndex((prev) => (prev + 1) % validImages.length);
  };

  return (
    <div className={`relative ${className}`}>
      <img
        src={validImages[index]}
        alt={`media-${index + 1}`}
        className={`w-full object-cover ${imgClassName}`}
      />

      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
            aria-label="Next image"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {validImages.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;



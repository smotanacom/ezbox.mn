interface ImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export default function Image({
  src,
  alt = 'Image',
  className = '',
}: ImageProps) {
  // Generate a placeholder image URL based on alt text for consistency
  const getPlaceholderUrl = (altText: string) => {
    // Use a hash of the alt text to get a consistent random seed
    const seed = altText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `https://picsum.photos/seed/${seed}/200/200`;
  };

  const imageUrl = src || getPlaceholderUrl(alt);

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className || 'max-w-[200px] max-h-[200px] rounded object-cover'}
    />
  );
}

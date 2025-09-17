import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@shared/schema";
import { convertImageUrl } from "@/lib/imageUtils";

interface ImageGalleryProps {
  photos: Photo[];
  title: string;
}

export default function ImageGallery({ photos, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">画像がありません</span>
      </div>
    );
  }

  const selectedPhoto = photos[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={convertImageUrl(selectedPhoto.url)}
          alt={`${title} - View ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
          data-testid={`img-main-${selectedIndex}`}
          onError={(e) => {
            console.error('Gallery image failed to load:', selectedPhoto.url);
          }}
        />
        
        {photos.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={goToPrevious}
              data-testid="button-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={goToNext}
              data-testid="button-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Image counter */}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {selectedIndex + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Grid */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              className={`w-full h-20 rounded cursor-pointer overflow-hidden border-2 transition-colors ${
                index === selectedIndex 
                  ? 'border-primary-500' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid={`thumb-${index}`}
            >
              <img
                src={convertImageUrl(photo.url)}
                alt={`${title} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Thumbnail failed to load:', photo.url);
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

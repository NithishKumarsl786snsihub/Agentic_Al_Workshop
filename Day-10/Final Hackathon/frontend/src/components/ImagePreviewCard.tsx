import React, { useState, useRef, useEffect } from 'react';
import { Globe, ExternalLink, Edit, Trash2, MoreHorizontal, Copy, Edit3 } from 'lucide-react';

interface Project {
  project_id: string;
  project_name: string;
  description: string;
  html_content: string;
  file_size: number;
  version: number;
  last_modified: string;
  created_at: string;
  is_auto_save: boolean;
  tags: string[];
  preview_image?: string;  // Base64 full image
  thumbnail_image?: string;  // Base64 thumbnail
}

interface ImagePreviewCardProps {
  project: Project;
  onPreview: (projectId: string) => void;
  onEdit: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onRename: (project: Project) => void;
  onDuplicate: (projectId: string) => void;
  isDropdownOpen: boolean;
  onDropdownToggle: (projectId: string) => void;
}

export const ImagePreviewCard: React.FC<ImagePreviewCardProps> = ({
  project,
  onPreview,
  onEdit,
  onDelete,
  onRename,
  onDuplicate,
  isDropdownOpen,
  onDropdownToggle
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate max scroll when image loads
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    
    if (imageRef.current && containerRef.current) {
      const imageHeight = imageRef.current.naturalHeight;
      const containerHeight = containerRef.current.clientHeight;
      const scaledImageHeight = imageHeight;
      const calculatedMaxScroll = Math.max(0, scaledImageHeight - containerHeight);
      
      setMaxScroll(calculatedMaxScroll);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    
    // Retry loading once after a delay
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    retryTimeoutRef.current = setTimeout(() => {
      if (imageRef.current) {
        imageRef.current.src = project.preview_image || project.thumbnail_image || '';
      }
    }, 2000);
  };

  // Smooth scroll animation with natural easing
  const animateScroll = (startTime?: number) => {
    if (!startTime) startTime = performance.now();
    const elapsed = performance.now() - startTime;
    
    // Slower, more natural duration (8 seconds)
    const duration = 8000;
    
    const progress = Math.min(elapsed / duration, 1);
    
    // Custom easing function for more natural movement
    const easeInOutCubic = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    const newPosition = easeInOutCubic * maxScroll;
    setScrollPosition(newPosition);

    if (progress < 1 && isHovering) {
      animationRef.current = requestAnimationFrame(() => animateScroll(startTime));
    } else if (progress >= 1) {
      // Pause at the bottom for 1.5 seconds before scrolling back
      setTimeout(() => {
        if (isHovering) {
          animateReverseScroll();
        }
      }, 1500);
    }
  };

  // Smooth reverse scroll animation
  const animateReverseScroll = (startTime?: number) => {
    if (!startTime) startTime = performance.now();
    const elapsed = performance.now() - startTime;
    
    // Slightly faster return (6 seconds)
    const duration = 6000;
    
    const progress = Math.min(elapsed / duration, 1);
    
    // Custom easing for smooth return
    const easeInOutCubic = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    const newPosition = maxScroll - (easeInOutCubic * maxScroll);
    setScrollPosition(newPosition);

    if (progress < 1 && isHovering) {
      animationRef.current = requestAnimationFrame(() => animateReverseScroll(startTime));
    } else if (progress >= 1 && isHovering) {
      // Pause at the top for 1.5 seconds before starting next cycle
      setTimeout(() => {
        if (isHovering) {
          animateScroll();
        }
      }, 1500);
    }
  };

  const handleHoverStart = () => {
    setIsHovering(true);
    setIsTransitioning(true);
    
    if (imageLoaded && maxScroll > 0) {
      // Start from the top with a small delay
      setScrollPosition(0);
      setTimeout(() => {
        if (isHovering) {
          animateScroll();
        }
      }, 200);
    }
  };

  const handleHoverEnd = () => {
    setIsHovering(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Smooth return to top
    const startPosition = scrollPosition;
    const startTime = performance.now();
    const duration = 1000; // 1 second return

    const animateReset = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing for reset
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const newPosition = startPosition * (1 - easeOutCubic);
      
      setScrollPosition(newPosition);

      if (progress < 1) {
        requestAnimationFrame(animateReset);
      } else {
        setIsTransitioning(false);
      }
    };

    requestAnimationFrame(animateReset);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
      {/* Preview Container */}
      <div 
        ref={containerRef}
        className="relative h-48 overflow-hidden cursor-pointer group"
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
        onClick={() => onPreview(project.project_id)}
      >
        <img
          ref={imageRef}
          src={project.preview_image || project.thumbnail_image}
          alt={`Preview of ${project.project_name}`}
          className="absolute top-0 left-0 w-full object-cover transition-transform duration-300"
          style={{
            transform: `translateY(-${scrollPosition}px)`,
            transition: isTransitioning ? 'transform 0.3s ease-out' : 'none'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Scroll Progress Indicator */}
        {imageLoaded && maxScroll > 0 && isHovering && (
          <div className="absolute right-2 top-2 bottom-2 w-1 bg-black/10 rounded-full overflow-hidden">
            <div 
              className="bg-white/50 w-full transition-all duration-200"
              style={{ 
                height: `${(scrollPosition / maxScroll) * 100}%`,
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.3)'
              }}
            />
          </div>
        )}

        {/* Loading/Error States */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-pulse">Loading...</div>
          </div>
        )}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Globe className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold truncate">{project.project_name}</h3>
          <div className="relative">
            <button
              onClick={() => onDropdownToggle(project.project_id)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                <button
                  onClick={() => onEdit(project.project_id)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => onRename(project)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Rename
                </button>
                <button
                  onClick={() => onDuplicate(project.project_id)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </button>
                <button
                  onClick={() => onDelete(project.project_id)}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 space-x-4">
          <span>{formatFileSize(project.file_size)}</span>
          <span>•</span>
          <span>{formatDate(project.last_modified)}</span>
        </div>
        
        {project.tags && project.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {project.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 
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
      const containerHeight = 192; // h-48 in pixels
      const scaleFactor = 0.75; // CSS scale
      const scaledImageHeight = imageHeight * scaleFactor;
      const calculatedMaxScroll = Math.max(0, scaledImageHeight - containerHeight);
      
      setMaxScroll(calculatedMaxScroll);
      
      // Start animation if already hovering
      if (isHovering && calculatedMaxScroll > 0) {
        animateScroll();
      }
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

  // Enhanced smooth scroll animation with dynamic easing
  const animateScroll = (startTime?: number) => {
    if (!startTime) startTime = performance.now();
    const elapsed = performance.now() - startTime;
    
    // Dynamic duration based on content length (3-8 seconds)
    const duration = Math.max(3000, Math.min(maxScroll * 6, 8000));
    
    const progress = Math.min(elapsed / duration, 1);
    
    // Enhanced easing function for smoother animation
    const easeInOutQuart = progress < 0.5
      ? 8 * progress * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 4) / 2;
    
    const newPosition = easeInOutQuart * maxScroll;
    setScrollPosition(newPosition);

    if (progress < 1 && isHovering) {
      animationRef.current = requestAnimationFrame(() => animateScroll(startTime));
    } else if (progress >= 1) {
      // Add a small delay before starting reverse scroll
      setTimeout(() => {
        if (isHovering) {
          animateReverseScroll();
        }
      }, 1000);
    }
  };

  // Reverse scroll animation
  const animateReverseScroll = (startTime?: number) => {
    if (!startTime) startTime = performance.now();
    const elapsed = performance.now() - startTime;
    const duration = 2000; // Faster return to top
    
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    const newPosition = maxScroll - (easeOutQuart * maxScroll);
    setScrollPosition(newPosition);

    if (progress < 1 && isHovering) {
      animationRef.current = requestAnimationFrame(() => animateReverseScroll(startTime));
    } else if (progress >= 1 && isHovering) {
      // Start forward scroll again after a small delay
      setTimeout(() => {
        if (isHovering) {
          animateScroll();
        }
      }, 1000);
    }
  };

  // Handle hover start with transition state
  const handleHoverStart = () => {
    setIsHovering(true);
    setIsTransitioning(true);
    
    if (imageLoaded && maxScroll > 0) {
      animateScroll();
    }
    
    // Reset transition state after animation starts
    setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
  };

  // Handle hover end with smooth reset
  const handleHoverEnd = () => {
    setIsHovering(false);
    setIsTransitioning(true);
    
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Smoothly reset scroll position
    const startPosition = scrollPosition;
    const startTime = performance.now();
    const duration = 300;

    const animateReset = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      const newPosition = startPosition - (startPosition * easeOutQuad);
      
      setScrollPosition(newPosition);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateReset);
      } else {
        setIsTransitioning(false);
      }
    };

    animationRef.current = requestAnimationFrame(animateReset);
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

  // Determine which image to show
  const displayImage = isHovering ? project.preview_image : (project.thumbnail_image || project.preview_image);
  const hasPreviewImage = !!(project.preview_image || project.thumbnail_image);

  return (
    <div className="bg-white/80 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 group">
      {/* Preview Area */}
      <div 
        ref={containerRef}
        className="relative w-full h-48 rounded-lg mb-3 overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 cursor-pointer"
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
        onClick={() => onPreview(project.project_id)}
      >
        {/* Base64 Image Preview */}
        {hasPreviewImage && !imageError ? (
          <div className="relative w-full h-full">
            <img
              ref={imageRef}
              src={displayImage}
              alt={`Preview of ${project.project_name}`}
              className="absolute top-0 left-0 w-full object-cover pointer-events-none scale-75 origin-top-left"
              style={{
                width: '133.33%', // Compensate for scale
                transform: `scale(0.75) translateY(-${scrollPosition}px)`,
                transition: isTransitioning ? 'transform 0.3s ease-out' : 'none'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
            
            {/* Loading overlay */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-white text-xs">Loading preview...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Fallback when no image */
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Globe className="w-12 h-12 text-white opacity-80" />
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-black/20 backdrop-blur-sm rounded px-2 py-1">
                <p className="text-white text-xs font-medium truncate">
                  {project.project_name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
        
        {/* Preview button overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1.5">
            <ExternalLink className="w-4 h-4 text-gray-700" />
          </div>
        </div>

        {/* Enhanced scroll progress indicator */}
        {imageLoaded && maxScroll > 0 && isHovering && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black/30 backdrop-blur-sm rounded-full h-1.5">
              <div 
                className="bg-white/80 h-full rounded-full transition-all duration-100"
                style={{ 
                  width: `${(scrollPosition / maxScroll) * 100}%`,
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 truncate" title={project.project_name}>
            {project.project_name}
          </h4>
          <div className="relative">
            <button 
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onDropdownToggle(project.project_id);
              }}
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename(project);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(project.project_id);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">v{project.version}</span>
          <span className="text-gray-500">{formatFileSize(project.file_size)}</span>
        </div>
        
        <div className="text-xs text-gray-600 truncate" title={project.description}>
          {project.description || 'No description'}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>{formatDate(project.last_modified)}</span>
        </div>
        
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 2 && (
              <span className="text-xs text-gray-500">
                +{project.tags.length - 2} more
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onPreview(project.project_id);
            }}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1"
            title="Preview in new tab"
          >
            <ExternalLink className="w-3 h-3" />
            Preview
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project.project_id);
            }}
            className="flex-1 py-2 px-3 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-1"
            title="Edit project"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.project_id);
            }}
            className="p-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-300"
            title="Delete project"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}; 
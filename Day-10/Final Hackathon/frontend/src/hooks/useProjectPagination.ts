import { useState, useEffect, useMemo } from 'react';

interface Project {
  project_id: string;
  project_name: string;
  html_content: string;
  last_modified: string;
  file_size: number;
}

interface UseProjectPaginationProps {
  projects: Project[];
  itemsPerPage?: number;
  priorityCount?: number; // Number of above-the-fold items to prioritize
}

interface UseProjectPaginationReturn {
  currentProjects: Project[];
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  priorityProjects: Project[];
  regularProjects: Project[];
}

export const useProjectPagination = ({
  projects,
  itemsPerPage = 12,
  priorityCount = 6
}: UseProjectPaginationProps): UseProjectPaginationReturn => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  // Split projects into priority (above-the-fold) and regular
  const { priorityProjects, regularProjects } = useMemo(() => {
    if (currentPage === 1) {
      return {
        priorityProjects: currentProjects.slice(0, priorityCount),
        regularProjects: currentProjects.slice(priorityCount)
      };
    }
    return {
      priorityProjects: [],
      regularProjects: currentProjects
    };
  }, [currentProjects, priorityCount, currentPage]);

  // Navigation functions
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to first page when projects change
  useEffect(() => {
    setCurrentPage(1);
  }, [projects.length]);

  return {
    currentProjects,
    totalPages,
    currentPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage,
    prevPage,
    goToPage,
    priorityProjects,
    regularProjects
  };
}; 
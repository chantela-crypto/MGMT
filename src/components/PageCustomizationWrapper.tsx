import React, { useEffect } from 'react';
import { usePageCustomization } from '../hooks/usePageCustomization';

interface PageCustomizationWrapperProps {
  pageId: string;
  children: React.ReactNode;
  className?: string;
}

const PageCustomizationWrapper: React.FC<PageCustomizationWrapperProps> = ({
  pageId,
  children,
  className = '',
}) => {
  const { getPageCustomization, applyPageCustomization } = usePageCustomization();

  useEffect(() => {
    // Apply page customization when component mounts
    applyPageCustomization(pageId);
    
    // Listen for page customization updates
    const handlePageUpdate = (event: CustomEvent) => {
      if (event.detail.pageId === pageId) {
        applyPageCustomization(pageId);
      }
    };
    
    window.addEventListener('pageCustomizationUpdated', handlePageUpdate as EventListener);
    
    return () => {
      window.removeEventListener('pageCustomizationUpdated', handlePageUpdate as EventListener);
    };
  }, [pageId]);

  const pageConfig = getPageCustomization(pageId);

  // Generate dynamic styles based on page configuration
  const pageStyles: React.CSSProperties = {
    '--page-primary': pageConfig.colors.primary,
    '--page-secondary': pageConfig.colors.secondary,
    '--page-accent': pageConfig.colors.accent,
    '--page-background': pageConfig.colors.background,
    '--page-surface': pageConfig.colors.surface,
    '--page-text-primary': pageConfig.colors.text.primary,
    '--page-text-secondary': pageConfig.colors.text.secondary,
    '--page-text-muted': pageConfig.colors.text.muted,
    '--page-success': pageConfig.colors.status.success,
    '--page-warning': pageConfig.colors.status.warning,
    '--page-error': pageConfig.colors.status.error,
    '--page-info': pageConfig.colors.status.info,
    '--page-heading-font': pageConfig.typography.headingFont,
    '--page-body-font': pageConfig.typography.bodyFont,
    '--page-spacing-xs': pageConfig.layout.spacing.xs,
    '--page-spacing-sm': pageConfig.layout.spacing.sm,
    '--page-spacing-md': pageConfig.layout.spacing.md,
    '--page-spacing-lg': pageConfig.layout.spacing.lg,
    '--page-spacing-xl': pageConfig.layout.spacing.xl,
    '--page-radius-sm': pageConfig.layout.borderRadius.sm,
    '--page-radius-md': pageConfig.layout.borderRadius.md,
    '--page-radius-lg': pageConfig.layout.borderRadius.lg,
    '--page-radius-xl': pageConfig.layout.borderRadius.xl,
    '--page-shadow-sm': pageConfig.layout.shadows.sm,
    '--page-shadow-md': pageConfig.layout.shadows.md,
    '--page-shadow-lg': pageConfig.layout.shadows.lg,
  } as React.CSSProperties;

  return (
    <div 
      className={`page-customized page-${pageId} ${className}`}
      style={pageStyles}
      data-page-id={pageId}
    >
      {children}
    </div>
  );
};

export default PageCustomizationWrapper;
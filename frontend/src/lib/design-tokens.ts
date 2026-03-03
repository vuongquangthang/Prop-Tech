// Design Tokens for Apartment Management System

export const designTokens = {
  // Colors
  colors: {
    brandPrimary: '#1A4B84',
    brandSurface: '#E8F0F8',
    success: '#1E7E34',
    error: '#D32F2F',
    warning: '#E67E22',
    textPrimary: '#121212',
    textSecondary: '#4A4A4A',
    textOnColor: '#FFFFFF',
    surfaceBg: '#F5F7FA',
    surfaceCard: '#FFFFFF',
    surfaceBorder: '#D1D5DB',
  },
  
  // Typography
  typography: {
    display: { fontSize: '44px', fontWeight: 700 },
    pageTitle: { fontSize: '35px', fontWeight: 700 },
    sectionTitle: { fontSize: '28px', fontWeight: 600 },
    bodyBold: { fontSize: '18px', fontWeight: 700 },
    body: { fontSize: '18px', fontWeight: 400 },
    caption: { fontSize: '15px', fontWeight: 400 },
  },
  
  // Sizing
  sizes: {
    buttonHeight: '56px',
    inputHeight: '52px',
  },
  
  // Spacing
  spacing: {
    betweenElements: '16px',
    insideCard: '24px',
    layoutGap: '32px',
  },
  
  // Border Radius
  radius: {
    button: '8px',
    card: '16px',
    large: '24px',
  },
};

// Helper functions for easy styling
export const getButtonStyle = (variant: 'primary' | 'error' | 'warning' | 'outline' = 'primary') => {
  const baseStyle = {
    padding: '16px 24px',
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: designTokens.typography.bodyBold.fontWeight,
    borderRadius: designTokens.radius.button,
    height: designTokens.sizes.buttonHeight,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  };
  
  const variants = {
    primary: {
      ...baseStyle,
      backgroundColor: designTokens.colors.brandPrimary,
      color: designTokens.colors.textOnColor,
    },
    error: {
      ...baseStyle,
      backgroundColor: designTokens.colors.error,
      color: designTokens.colors.textOnColor,
    },
    warning: {
      ...baseStyle,
      backgroundColor: designTokens.colors.warning,
      color: designTokens.colors.textOnColor,
    },
    outline: {
      ...baseStyle,
      backgroundColor: designTokens.colors.surfaceCard,
      color: designTokens.colors.brandPrimary,
      border: `2px solid ${designTokens.colors.brandPrimary}`,
    },
  };
  
  return variants[variant];
};

export const getInputStyle = () => ({
  padding: '12px 16px',
  fontSize: designTokens.typography.body.fontSize,
  fontWeight: designTokens.typography.body.fontWeight,
  borderRadius: designTokens.radius.button,
  height: designTokens.sizes.inputHeight,
  border: `1px solid ${designTokens.colors.surfaceBorder}`,
  backgroundColor: designTokens.colors.surfaceCard,
  color: designTokens.colors.textPrimary,
});

export const getCardStyle = () => ({
  backgroundColor: designTokens.colors.surfaceCard,
  border: `1px solid ${designTokens.colors.surfaceBorder}`,
  borderRadius: designTokens.radius.card,
  padding: designTokens.spacing.insideCard,
});

export const getTableHeaderStyle = () => ({
  fontSize: designTokens.typography.bodyBold.fontSize,
  fontWeight: designTokens.typography.bodyBold.fontWeight,
  color: designTokens.colors.textPrimary,
  paddingBottom: '16px',
  borderBottom: `2px solid ${designTokens.colors.surfaceBorder}`,
});

export const getTableCellStyle = () => ({
  fontSize: designTokens.typography.body.fontSize,
  fontWeight: designTokens.typography.body.fontWeight,
  color: designTokens.colors.textPrimary,
  paddingTop: '20px',
  paddingBottom: '20px',
  borderBottom: `1px solid ${designTokens.colors.surfaceBorder}`,
});

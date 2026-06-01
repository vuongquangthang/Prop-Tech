// Design Tokens for Apartment Management System

export const designTokens = {
  // Colors
  colors: {
    brandPrimary: '#1E4E8C',
    brandSecondary: '#334155',
    brandSurface: '#EAF1F8',
    success: '#15803D',
    error: '#B42318',
    warning: '#B45309',
    info: '#0369A1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textOnColor: '#FFFFFF',
    surfaceBg: '#F4F7FB',
    surfaceCard: '#FFFFFF',
    surfaceCardSubtle: '#F8FAFC',
    surfaceBorder: '#D7E0EA',
  },
  
  // Typography
  typography: {
    display: { fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', fontWeight: 700 },
    pageTitle: { fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', fontWeight: 700 },
    sectionTitle: { fontSize: 'clamp(1.25rem, 1.8vw, 1.75rem)', fontWeight: 700 },
    bodyBold: { fontSize: '1rem', fontWeight: 600 },
    body: { fontSize: '0.9375rem', fontWeight: 400 },
    caption: { fontSize: '0.8125rem', fontWeight: 400 },
  },
  
  // Sizing
  sizes: {
    buttonHeight: '44px',
    inputHeight: '44px',
  },
  
  // Spacing
  spacing: {
    betweenElements: '12px',
    insideCard: '20px',
    layoutGap: '24px',
  },
  
  // Border Radius
  radius: {
    button: '12px',
    card: '16px',
    large: '24px',
  },
};

// Helper functions for easy styling
export const getButtonStyle = (variant: 'primary' | 'error' | 'warning' | 'outline' = 'primary') => {
  const baseStyle = {
    padding: '12px 16px',
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: designTokens.typography.bodyBold.fontWeight,
    borderRadius: designTokens.radius.button,
    height: designTokens.sizes.buttonHeight,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.16s ease',
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
      border: `1px solid ${designTokens.colors.surfaceBorder}`,
    },
  };
  
  return variants[variant];
};

export const getInputStyle = () => ({
  padding: '10px 14px',
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

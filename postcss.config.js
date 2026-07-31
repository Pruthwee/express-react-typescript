// Processes LESS-compiled CSS through CSSNano for production optimization

    // This reduces file size and improves CloudFront CDN delivery performance
    ...(process.env.NODE_ENV === 'production'
      ? [
          [
            'cssnano',
            {
              preset: [
                'default',
                {
                  // Remove all comments
                  discardComments: {
                    removeAll: true,
                  },
                  // Normalize whitespace
                  normalizeWhitespace: true,
                  // Minify selectors
                  minifySelectors: true,
                  // Minify font values
                  minifyFontValues: true,
                  // Convert colors to shortest form
                  colormin: true,
                  // Merge rules
                  mergeRules: true,
                  // Remove duplicate rules
                  discardDuplicates: true,
                  // Remove empty rules
                  // Optimize calc() expressions
                  calc: true,
                  // Optimize z-index values
                  zindex: false, // Keep z-index values as-is for safety
                  // Reduce initial values
                  reduceInitial: true,
      : []),
  ],
};

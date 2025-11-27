/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Properly handle externals - push each one individually
    // and use a function for scoped packages to avoid invalid JavaScript identifiers
    const originalExternals = config.externals;
    const externalPackages = [
      'pino-pretty',
      'lokijs',
      'encoding',
    ];
    
    // Push regular packages
    if (Array.isArray(originalExternals)) {
      externalPackages.forEach(pkg => {
        if (!originalExternals.includes(pkg)) {
          originalExternals.push(pkg);
        }
      });
      config.externals = originalExternals;
    } else {
      config.externals = [originalExternals, ...externalPackages].filter(Boolean);
    }
    
    // Handle scoped package separately using a function to avoid invalid identifier issues
    const scopedExternal = ({ request }, callback) => {
      if (request === '@react-native-async-storage/async-storage') {
        // Return as commonjs string to avoid using @ as identifier
        return callback(null, 'commonjs @react-native-async-storage/async-storage');
      }
      callback();
    };
    
    // Add the scoped external handler
    if (Array.isArray(config.externals)) {
      config.externals.push(scopedExternal);
    } else {
      config.externals = [config.externals, scopedExternal].filter(Boolean);
    }
    
    return config;
  },
};

module.exports = nextConfig;

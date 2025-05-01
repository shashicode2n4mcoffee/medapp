// Export all API services from this central file
// This allows importing multiple services with a single import statement

// Export API client
export { default as apiClient } from './apiClient';

// Export auth service
export { default as authService } from './authService';

// Add other service exports as they are created
// Example: export { default as userService } from './userService';
// Example: export { default as dataService } from './dataService';

// You can also create named exports for specific functions or types
// that might be needed across the application
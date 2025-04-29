import { configureStore, Middleware } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';

// Custom middleware to log actions and state
const actionLogger: Middleware = store => next => (action: unknown) => {
  // Type guard to check if action is an object with a type property
  const actionType = typeof action === 'object' && action !== null && 'type' in action 
    ? (action as { type: string }).type 
    : 'unknown';
  console.group(`ACTION: ${actionType}`);
  console.log('Old State:', store.getState());
  console.log('Action:', action);
  const result = next(action);
  console.log('New State:', store.getState());
  console.groupEnd();
  return result;
};

// Logger middleware for development
const logger = createLogger({
  collapsed: true,
});

// Create store with middleware
const middleware = [actionLogger];

// Only add redux-logger in development
if (__DEV__) {
  middleware.push(logger);
}

// Configure store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more reducers here as your app grows
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(middleware),
});

// Export store types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// For use with useDispatch and useSelector hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
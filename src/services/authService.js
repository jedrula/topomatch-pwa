// Simple auth service for boulder problems
// This is a placeholder until proper authentication is implemented

export const getCurrentUser = () => {
  // For now, return a mock user for development
  // In production, this should integrate with Firebase Auth or your auth system
  return {
    uid: "dev-user-123",
    email: "dev@example.com",
    displayName: "Development User",
  };
};

export const authService = {
  getCurrentUser,

  // Placeholder for future auth methods
  signIn: async (email, password) => {
    throw new Error("Authentication not implemented yet");
  },

  signOut: async () => {
    throw new Error("Authentication not implemented yet");
  },

  signUp: async (email, password) => {
    throw new Error("Authentication not implemented yet");
  },
};

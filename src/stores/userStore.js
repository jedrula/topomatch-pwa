import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin' // Change this to 'user' to test different perspectives
    },
    isLoggedIn: true
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isUser: (state) => state.user?.role === 'user',
    canEditLocations: (state) => state.user?.role === 'admin',
    canDeleteLocations: (state) => state.user?.role === 'admin',
    canCreateLocations: (state) => state.user?.role === 'admin',
    canViewLocations: (state) => state.isLoggedIn, // All logged-in users can view
    canUploadImages: (state) => state.user?.role === 'admin'
  },

  actions: {
    // Simulate switching user role for testing
    switchToAdmin() {
      this.user.role = 'admin'
    },

    switchToUser() {
      this.user.role = 'user'
    },

    // Simulate login/logout
    login(userData) {
      this.user = userData
      this.isLoggedIn = true
    },

    logout() {
      this.user = null
      this.isLoggedIn = false
    },

    // Helper method for testing - toggle between admin and user
    toggleRole() {
      this.user.role = this.user.role === 'admin' ? 'user' : 'admin'
    }
  }
})

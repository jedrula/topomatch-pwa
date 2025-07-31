import { getFunctions, httpsCallable } from "firebase/functions";
import { functions } from "./firebase.js";

class AdminService {
  constructor() {
    this.setAdminRoleFunction = httpsCallable(functions, 'setAdminRole');
    this.initializeAdminFunction = httpsCallable(functions, 'initializeAdmin');
  }

  // Grant or revoke admin privileges (only existing admins can call this)
  async setAdminRole(uid, isAdmin) {
    try {
      const result = await this.setAdminRoleFunction({ uid, isAdmin });
      return result.data;
    } catch (error) {
      console.error("Error setting admin role:", error);
      throw new Error(error.message || "Failed to update admin role");
    }
  }

  // Initialize the first admin (can only be called when no admins exist)
  async initializeFirstAdmin(email) {
    try {
      const result = await this.initializeAdminFunction({ email });
      return result.data;
    } catch (error) {
      console.error("Error initializing admin:", error);
      throw new Error(error.message || "Failed to initialize admin");
    }
  }
}

export const adminService = new AdminService();

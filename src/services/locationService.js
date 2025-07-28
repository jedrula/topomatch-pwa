// Firebase configuration for local development
const FIREBASE_CONFIG = {
  functionsEmulatorURL: "http://127.0.0.1:5001",
  firestoreEmulatorURL: "http://127.0.0.1:8080",
};

class LocationService {
  constructor() {
    // Use emulator URL for development
    this.baseURL = `${FIREBASE_CONFIG.functionsEmulatorURL}/your-project-id/us-central1`;
  }

  async createLocation(location) {
    try {
      const response = await fetch(`${this.baseURL}/createLocation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(location),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating location:", error);
      throw error;
    }
  }

  async getLocations() {
    try {
      const response = await fetch(`${this.baseURL}/getLocations`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting locations:", error);
      throw error;
    }
  }

  async getLocation(id) {
    try {
      const response = await fetch(`${this.baseURL}/getLocation?id=${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting location:", error);
      throw error;
    }
  }

  async updateLocation(id, location) {
    try {
      const response = await fetch(`${this.baseURL}/updateLocation?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(location),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  }

  async deleteLocation(id) {
    try {
      const response = await fetch(`${this.baseURL}/deleteLocation?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      throw error;
    }
  }
}

export const locationService = new LocationService();

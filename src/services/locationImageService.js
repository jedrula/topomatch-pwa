// Service for managing location images
class LocationImageService {
  constructor() {
    this.baseURL = "http://127.0.0.1:5001/your-project-id/us-central1";
  }

  async addImageToLocation(locationId, imageData) {
    try {
      const response = await fetch(`${this.baseURL}/addLocationImage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          ...imageData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding image to location:", error);
      throw error;
    }
  }

  async getLocationImages(locationId) {
    try {
      const response = await fetch(`${this.baseURL}/getLocationImages?locationId=${locationId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting location images:", error);
      throw error;
    }
  }

  async deleteLocationImage(imageId) {
    try {
      const response = await fetch(`${this.baseURL}/deleteLocationImage?imageId=${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting location image:", error);
      throw error;
    }
  }
}

export const locationImageService = new LocationImageService();

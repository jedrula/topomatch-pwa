/**
 * Utility functions for handling grading systems
 */

/**
 * Get the display label for a grade
 * Handles object-based grades
 * @param {object} grade - The grade value
 * @returns {string} The display label for the grade
 */
export function getGradeLabel(grade) {
  if (!grade) return "Ungraded";

  // If it's an object with label property, return the label
  if (typeof grade === "object" && grade.label) {
    return grade.label;
  }

  // Fallback
  return "Ungraded";
}

/**
 * Get the difficulty value for a grade
 * @param {object} grade - The grade value
 * @returns {number} The difficulty value (for sorting/comparison)
 */
export function getGradeDifficulty(grade) {
  if (!grade) return 0;

  // If it's an object with difficulty property, return that
  if (typeof grade === "object" && typeof grade.difficulty === "number") {
    return grade.difficulty;
  }

  return 0;
}

/**
 * Check if a grade matches a grading system grade
 * @param {object} problemGrade - The problem's grade
 * @param {object} systemGrade - A grade from the grading system
 * @returns {boolean} Whether they match
 */
export function gradesMatch(problemGrade, systemGrade) {
  const problemLabel = getGradeLabel(problemGrade);
  const systemLabel = getGradeLabel(systemGrade);
  return problemLabel === systemLabel;
}

/**
 * Get the color for a grade based on V-scale difficulty
 * @param {string|object} grade - The grade value (e.g., "V3", "V0+", etc.)
 * @returns {string} The hex color for the grade
 */
export function getGradeColor(grade) {
  // Handle object grades - extract the label
  const gradeLabel = typeof grade === "object" && grade.label ? grade.label : grade;
  
  if (!gradeLabel) return "#6b7280"; // gray-500 as default
  
  const colors = {
    VB: "#10b981", // green-500
    V0: "#059669", // green-600
    "V0+": "#047857", // green-700
    V1: "#0d9488", // teal-600
    "V1+": "#0f766e", // teal-700
    V2: "#0891b2", // sky-600
    "V2+": "#0e7490", // sky-700
    V3: "#0284c7", // blue-600
    "V3+": "#1d4ed8", // blue-700
    V4: "#2563eb", // blue-600
    "V4+": "#1e40af", // blue-700
    V5: "#7c3aed", // violet-600
    "V5+": "#6d28d9", // violet-700
    V6: "#c026d3", // fuchsia-600
    "V6+": "#a21caf", // fuchsia-700
    V7: "#db2777", // pink-600
    "V7+": "#be185d", // pink-700
    V8: "#dc2626", // red-600
    "V8+": "#b91c1c", // red-700
    V9: "#ea580c", // orange-600
    "V9+": "#c2410c", // orange-700
    V10: "#d97706", // amber-600
    "V10+": "#b45309", // amber-700
    V11: "#ca8a04", // yellow-600
    "V11+": "#a16207", // yellow-700
    V12: "#65a30d", // lime-600
    "V12+": "#4d7c0f", // lime-700
    V13: "#16a34a", // green-600
    "V13+": "#15803d", // green-700
    V14: "#374151", // gray-700
    "V14+": "#1f2937", // gray-800
    V15: "#374151", // gray-700
    "V15+": "#1f2937", // gray-800
    V16: "#1f2937", // gray-800
  };
  
  return colors[gradeLabel] || "#6b7280"; // gray-500 as default
}

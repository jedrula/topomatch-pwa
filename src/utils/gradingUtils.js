/**
 * Utility functions for handling grading systems
 */

/**
 * Get the display label for a grade
 * Handles both legacy string grades and new object-based grades
 * @param {string|object} grade - The grade value
 * @returns {string} The display label for the grade
 */
export function getGradeLabel(grade) {
  if (!grade) return "Ungraded";

  // If it's already a string (legacy format), return as-is
  if (typeof grade === "string") {
    return grade;
  }

  // If it's an object with label property (new format), return the label
  if (typeof grade === "object" && grade.label) {
    return grade.label;
  }

  // Fallback - stringify the grade
  return String(grade);
}

/**
 * Get the difficulty value for a grade
 * @param {string|object} grade - The grade value
 * @returns {number} The difficulty value (for sorting/comparison)
 */
export function getGradeDifficulty(grade) {
  if (!grade) return 0;

  // If it's an object with difficulty property, return that
  if (typeof grade === "object" && typeof grade.difficulty === "number") {
    return grade.difficulty;
  }

  // Fallback for legacy string grades - try to parse V-Scale
  if (typeof grade === "string") {
    if (grade === "VB") return 0;
    const vMatch = grade.match(/^V(\d+)$/);
    if (vMatch) return parseInt(vMatch[1]) + 1;
  }

  return 0;
}

/**
 * Check if a grade matches a grading system grade
 * @param {string|object} problemGrade - The problem's grade
 * @param {string|object} systemGrade - A grade from the grading system
 * @returns {boolean} Whether they match
 */
export function gradesMatch(problemGrade, systemGrade) {
  const problemLabel = getGradeLabel(problemGrade);
  const systemLabel = getGradeLabel(systemGrade);
  return problemLabel === systemLabel;
}

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

import { unref } from 'vue';
import ContextMenu from '@imengyu/vue3-context-menu';

/**
 * Composable for image context menus with analyze/move/delete options
 * @param {Object} options
 * @param {Function} options.onAnalyze - Callback when "Analyze holds" is clicked
 * @param {Function} options.onDelete - Callback when "Delete image" is clicked
 * @param {Function} options.onMove - Callback when "Move to section" is clicked
 * @param {Ref|Array} options.sections - Available sections for "Move to..." submenu (flat, single-area fallback)
 * @param {Ref} options.floorplans - Optional: all floorplans for grouped multi-area menu
 * @param {String} options.currentSectionId - Optional: ID of current section to exclude from "Move to..." menu
 */
export function useImageContextMenu({ onAnalyze, onDelete, onMove, sections, floorplans, currentSectionId = null }) {
  const showContextMenu = (event, image) => {
    event.preventDefault();
    
    const menuItems = [
      {
        label: 'Analyze holds',
        onClick: () => onAnalyze(image)
      }
    ];

    // Build Move to... children — grouped by area when multiple floorplans exist
    const plans = unref(floorplans);
    const sectionId = unref(currentSectionId);
    let moveToChildren = [];

    if (plans && plans.length > 1) {
      for (const fp of plans) {
        const available = fp.sections.filter(s => s.id !== sectionId);
        if (!available.length) continue;
        if (moveToChildren.length > 0) moveToChildren.push({ divided: true });
        moveToChildren.push({ label: fp.name, disabled: true });
        available.forEach(s => moveToChildren.push({ label: s.name, onClick: () => onMove(image, s.id) }));
      }
    } else {
      const allSections = unref(sections) ?? [];
      const available = sectionId
        ? allSections.filter(s => s.id !== sectionId)
        : allSections;
      moveToChildren = available.map(s => ({ label: s.name, onClick: () => onMove(image, s.id) }));
    }
    
    if (moveToChildren.length > 0) {
      menuItems.push({
        label: 'Move to...',
        children: moveToChildren
      });
    }
    
    menuItems.push(
      { divided: true },
      {
        label: 'Delete image',
        onClick: () => onDelete(image)
      }
    );
    
    ContextMenu.showContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: menuItems
    });
  };

  return {
    showContextMenu
  };
}

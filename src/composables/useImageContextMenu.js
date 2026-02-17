import ContextMenu from '@imengyu/vue3-context-menu';

/**
 * Composable for image context menus with analyze/move/delete options
 * @param {Object} options
 * @param {Function} options.onAnalyze - Callback when "Analyze holds" is clicked
 * @param {Function} options.onDelete - Callback when "Delete image" is clicked
 * @param {Function} options.onMove - Callback when "Move to section" is clicked
 * @param {Ref|Array} options.sections - Available sections for "Move to..." submenu
 * @param {String} options.currentSectionId - Optional: ID of current section to exclude from "Move to..." menu
 */
export function useImageContextMenu({ onAnalyze, onDelete, onMove, sections, currentSectionId = null }) {
  const showContextMenu = (event, image) => {
    event.preventDefault();
    
    const menuItems = [
      {
        label: 'Analyze holds',
        onClick: () => onAnalyze(image)
      }
    ];
    
    // Filter sections if currentSectionId is provided
    const availableSections = currentSectionId 
      ? sections.value?.filter(s => s.id !== currentSectionId) || []
      : sections.value || [];
    
    // Add "Move to..." submenu if sections exist
    if (availableSections.length > 0) {
      menuItems.push({
        label: 'Move to...',
        children: availableSections.map(section => ({
          label: section.name,
          onClick: () => onMove(image, section.id)
        }))
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

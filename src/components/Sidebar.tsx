import React from 'react';
import { useSidebarConfig } from '../hooks/useSidebarConfig';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  alertCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, alertCount = 0 }) => {
  const { sidebarConfig, getMenuHierarchy } = useSidebarConfig();
  const [forceUpdate, setForceUpdate] = React.useState(0);
  
  // Get menu items from configuration
  const menuItems = React.useMemo(() => {
    return sidebarConfig.menuItems
      .filter(item => item.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [sidebarConfig, forceUpdate]);
  
  // Listen for sidebar configuration updates
  React.useEffect(() => {
    const handleSidebarUpdate = () => {
      // Force component re-render when sidebar config changes
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('sidebarConfigUpdated', handleSidebarUpdate);
    window.addEventListener('sidebarUpdated', handleSidebarUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'sidebarConfig') {
        handleSidebarUpdate();
      }
    });
    
    return () => {
      window.removeEventListener('sidebarConfigUpdated', handleSidebarUpdate);
      window.removeEventListener('sidebarUpdated', handleSidebarUpdate);
    };
  }, []);

  const renderMenuItem = (item: any) => {
    // Handle separators
    if (item.label === '---' || item.id.startsWith('separator-')) {
      return (
        <li key={item.id} className="my-2">
          <hr className="border-gray-300" />
        </li>
      );
    }

    return (
      <li key={item.id}>
        <button
          onClick={() => onViewChange(item.route)}
          className={`w-full flex items-center px-4 py-3 text-xs font-normal uppercase tracking-wide rounded-xl transition-colors ${
            activeView === item.route
              ? 'bg-gray-200 text-gray-800'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          type="button"
        >
          {item.label}
        </button>
      </li>
    );
  };

  return (
    <aside className="bg-gray-100 w-64 min-h-screen border-r border-gray-300">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {menuItems.map(item => renderMenuItem(item))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
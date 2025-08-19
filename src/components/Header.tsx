import React from 'react';
import { User, LogOut, Settings, Bell } from 'lucide-react';
import { User as UserType } from '../types/division';

interface HeaderProps {
  currentUser: UserType;
  onLogout: () => void;
  alertCount?: number;
  onNotificationsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, alertCount = 0, onNotificationsClick }) => {
  // Listen for branding updates
  React.useEffect(() => {
    const handleBrandingUpdate = () => {
      // Force component re-render when branding changes
      window.dispatchEvent(new Event('resize'));
    };
    
    window.addEventListener('brandingUpdated', handleBrandingUpdate);
    window.addEventListener('brandingConfigurationUpdated', handleBrandingUpdate);
    
    return () => {
      window.removeEventListener('brandingUpdated', handleBrandingUpdate);
      window.removeEventListener('brandingConfigurationUpdated', handleBrandingUpdate);
    };
  }, []);
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <img 
                  src="/logo tb.png"
                  alt="True Balance"
                  className="mr-3"
                  style={{ 
                    height: 'var(--logo-height, 32px)', 
                    width: 'var(--logo-width, auto)' 
                  }}
                />
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    Clinic Management Portal
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <div className="text-sm">
            onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                <p style={{ color: 'var(--color-primary)' }} className="capitalize">
                  {currentUser.role?.replace('-', ' ') || 'User'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={onNotificationsClick}
              className="relative p-2 text-gray-400 transition-colors"
              type="button"
              onMouseEnter={(e) => e.currentTarget.style.color = '#ec4899'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <Bell className="h-5 w-5" />
              {alertCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-error)' }}
                >
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </button>
            
            <button 
              className="p-2 text-gray-400 transition-colors"
              type="button"
              onMouseEnter={(e) => e.currentTarget.style.color = '#ec4899'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <Settings className="h-5 w-5" />
            </button>
            
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 transition-colors"
              type="button"
              onMouseEnter={(e) => e.currentTarget.style.color = '#ec4899'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
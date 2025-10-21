import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import ToolPanel from './ToolPanel';
import MapControls from './MapControls';
import FogRegionManager from './FogRegionManager';
import PlayerView from '../views/PlayerView';

const Sidebar: React.FC = () => {
  const {
    sidebarRef,
    isDMView,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarWidth,
    setSidebarWidth,
    isResizing,
    setIsResizing,
    dmNotes,
    setDmNotes,
  } = useAppContext();

  // Handle sidebar resize
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    e.preventDefault();
    const newWidth = Math.max(300, Math.min(600, window.innerWidth - e.clientX));

    // Direct DOM manipulation instead of state update
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
    }
  };

  const handleMouseUp = () => {
    if (!isResizing) return;
    if (sidebarRef.current) {
      const width = sidebarRef.current.getBoundingClientRect().width;
      setSidebarWidth(width);
    }
    setIsResizing(false);
  };

  const preventSelection = (e: Event) => {
    e.preventDefault();
    return false;
  };

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('selectstart', preventSelection as any);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('selectstart', preventSelection as any);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      };
    }
  }, [isResizing]);

  return (
    <div
      ref={sidebarRef}
      className="relative bg-gray-800 text-white overflow-hidden transition-none"
      style={{
        width: sidebarCollapsed ? '48px' : `${sidebarWidth}px`,
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Resize Handle */}
      {!sidebarCollapsed && (
        <div
          className="absolute left-0 top-0 w-1 h-full cursor-ew-resize z-20 hover:w-2 transition-all duration-200 group"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          style={{
            background: isResizing ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            boxShadow: isResizing ? 'inset 0 0 10px rgba(255, 255, 255, 0.1)' : 'none'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:from-gray-600/50 group-hover:to-transparent transition-all duration-200" />
        </div>
      )}

      {/* Collapse/Expand Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute top-3 left-3 z-10 w-7 h-7 bg-gray-700/80 backdrop-blur rounded hover:bg-gray-600 transition flex items-center justify-center text-gray-400 hover:text-white text-sm"
      >
        {sidebarCollapsed ? '▶' : '◀'}
      </button>

      {/* Content */}
      <div className={`p-4 overflow-y-auto h-full ${sidebarCollapsed ? 'invisible' : 'visible'} ${!sidebarCollapsed ? 'pl-6' : ''} no-select`}>
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">
          {isDMView ? "DM Map Editor" : "Player Map"}
        </h2>

        {isDMView ? (
          <>
            <ToolPanel />
            <MapControls />
            <FogRegionManager />

            {/* Saved Maps section is in MapControls */}

            {/* Instructions */}
            <div className="mb-4 p-3 bg-gray-700 rounded">
              <h3 className="font-bold mb-2 text-yellow-300">How to Use:</h3>
              <ol className="text-sm space-y-1">
                <li>1. Draw your map with brush tool</li>
                <li>2. Use eraser to fix mistakes</li>
                <li>3. Switch to Fog Region tool</li>
                <li>4. Click points to outline clickable areas</li>
                <li>5. Complete each region (min 3 points)</li>
                <li>6. Switch to Player View to test</li>
              </ol>
            </div>

            {/* DM Notes */}
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="font-bold mb-2 text-yellow-400">Session Notes</h3>
              <textarea
                value={dmNotes}
                onChange={(e) => setDmNotes(e.target.value)}
                className="w-full h-32 p-2 bg-gray-600 rounded text-sm"
                placeholder="Room descriptions, encounters, treasure..."
              />
            </div>
          </>
        ) : (
          <PlayerView />
        )}
      </div>
    </div>
  );
};

export default Sidebar;

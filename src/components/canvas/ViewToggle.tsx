import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useFogRegions } from '../../hooks/useFogRegions';

const ViewToggle: React.FC = () => {
  const {
    isDMView,
    setIsDMView,
    setTool,
    setCurrentRegion
  } = useAppContext();
  
  const { resetRevealedRegions } = useFogRegions();

  const handleViewToggle = () => {
    setIsDMView(!isDMView);
    setTool('brush');
    setCurrentRegion([]);
  };

  return (
    <div className="absolute top-4 left-4 bg-gray-800 p-3 rounded-lg shadow-lg border-2 border-yellow-600">
      <button
        onClick={handleViewToggle}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-bold"
      >
        Switch to {isDMView ? 'Player' : 'DM'} View
      </button>
      {!isDMView && (
        <button
          onClick={resetRevealedRegions}
          className="ml-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
        >
          Reset Fog
        </button>
      )}
    </div>
  );
};

export default ViewToggle;

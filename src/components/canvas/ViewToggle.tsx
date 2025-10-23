import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useFogRegions } from '../../hooks/useFogRegions';
import { useRealtimeSession } from '../../realtime/useRealtimeSession';

const ViewToggle: React.FC = () => {
  const {
    isDMView,
    setIsDMView,
    setTool,
    setCurrentRegion
  } = useAppContext();
  
  const { resetRevealedRegions } = useFogRegions();
  const realtime = useRealtimeSession();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [joiningCode, setJoiningCode] = useState('');

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
        Switch to {isDMView ? 'Player' : 'Dungeon Map'} View
      </button>
      {!isDMView && (
        <button
          onClick={resetRevealedRegions}
          className="ml-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
        >
          Reset Fog
        </button>
      )}

      {/* Hosting Controls */}
      <div className="mt-2 flex items-center gap-2">
        {realtime.status !== 'live' || realtime.role !== 'dm' ? (
          <button
            onClick={async () => {
              const { shareUrl } = await realtime.startHosting();
              setShareUrl(shareUrl);
            }}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Host game
          </button>
        ) : (
          <button
            onClick={realtime.stopHosting}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
          >
            Stop
          </button>
        )}

        {/* Join by code */}
        <input
          value={joiningCode}
          onChange={(e) => setJoiningCode(e.target.value.toUpperCase())}
          placeholder="Code"
          className="px-2 py-1 bg-gray-700 rounded text-sm w-24"
        />
        <button
          onClick={() => {
            if (joiningCode.trim()) realtime.joinWithCode(joiningCode.trim());
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Join
        </button>
      </div>

      {/* Share URL and presence */}
      {shareUrl && realtime.role === 'dm' && realtime.status === 'live' && (
        <div className="mt-2 text-xs text-gray-200">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
            Live • Players: {realtime.players}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="px-2 py-1 bg-gray-700 rounded text-[10px] w-64"
            />
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="px-2 py-1 bg-gray-600 rounded text-[10px]"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewToggle;

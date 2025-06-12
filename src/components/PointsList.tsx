import React from 'react';
import { Trash2, MapPin } from 'lucide-react';
import { LabeledPoint } from '../types';

interface PointsListProps {
  points: LabeledPoint[];
  onRemovePoint: (id: string) => void;
}

const PointsList: React.FC<PointsListProps> = ({ points, onRemovePoint }) => {
  if (points.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Labeled Points</h3>
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No points labeled yet.</p>
          <p className="text-gray-400 text-xs mt-1">Start labeling to see points here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Labeled Points ({points.length})</h3>
      <div className="space-y-3">
        {points.map((point, index) => (
          <div
            key={point.id}
            className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${(index * 137.508) % 360}, 70%, 50%)` }}
                  />
                  <span className="font-medium text-gray-900 text-sm">{point.label}</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    <strong>Position:</strong><br />
                    X: {point.position.x.toFixed(3)}<br />
                    Y: {point.position.y.toFixed(3)}<br />
                    Z: {point.position.z.toFixed(3)}
                  </div>
                  {point.normal && (
                    <div>
                      <strong>Normal:</strong><br />
                      X: {point.normal.x.toFixed(3)}<br />
                      Y: {point.normal.y.toFixed(3)}<br />
                      Z: {point.normal.z.toFixed(3)}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onRemovePoint(point.id)}
                className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove point"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PointsList;
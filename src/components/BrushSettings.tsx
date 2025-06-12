import React from 'react';
import { Brush, Settings } from 'lucide-react';
import { BrushSettings } from '../types';

interface BrushSettingsPanelProps {
  settings: BrushSettings;
  onSettingsChange: (settings: BrushSettings) => void;
}

const BrushSettingsPanel: React.FC<BrushSettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  const updateSetting = <K extends keyof BrushSettings>(
    key: K,
    value: BrushSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Brush className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Brush Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Brush Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Size</label>
            <span className="text-sm text-gray-500">{settings.size.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={settings.size}
            onChange={(e) => updateSetting('size', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Brush Strength */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Strength</label>
            <span className="text-sm text-gray-500">{Math.round(settings.strength * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={settings.strength}
            onChange={(e) => updateSetting('strength', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Brush Falloff */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Falloff</label>
          <div className="grid grid-cols-3 gap-2">
            {(['constant', 'linear', 'smooth'] as const).map((falloffType) => (
              <button
                key={falloffType}
                onClick={() => updateSetting('falloff', falloffType)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  settings.falloff === falloffType
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {falloffType.charAt(0).toUpperCase() + falloffType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Brush Preview */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2">Brush Preview</div>
          <div className="flex items-center justify-center h-16 bg-white rounded border">
            <div
              className="rounded-full border-2 border-orange-400 bg-orange-100"
              style={{
                width: `${Math.max(8, settings.size * 60)}px`,
                height: `${Math.max(8, settings.size * 60)}px`,
                opacity: settings.strength
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrushSettingsPanel;
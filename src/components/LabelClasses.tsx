import React, { useState } from 'react';
import { Plus, Eye, EyeOff, Edit2, Trash2, Palette } from 'lucide-react';
import { LabelClass } from '../types';

interface LabelClassesProps {
  classes: LabelClass[];
  activeClassId: string | null;
  onClassesChange: (classes: LabelClass[]) => void;
  onActiveClassChange: (classId: string | null) => void;
}

const LabelClasses: React.FC<LabelClassesProps> = ({
  classes,
  activeClassId,
  onClassesChange,
  onActiveClassChange
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const predefinedColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
  ];

  const addNewClass = () => {
    const newClass: LabelClass = {
      id: Date.now().toString(),
      name: `Class ${classes.length + 1}`,
      color: predefinedColors[classes.length % predefinedColors.length],
      visible: true
    };
    onClassesChange([...classes, newClass]);
  };

  const updateClass = (id: string, updates: Partial<LabelClass>) => {
    onClassesChange(classes.map(cls => 
      cls.id === id ? { ...cls, ...updates } : cls
    ));
  };

  const deleteClass = (id: string) => {
    onClassesChange(classes.filter(cls => cls.id !== id));
    if (activeClassId === id) {
      onActiveClassChange(null);
    }
  };

  const startEditing = (cls: LabelClass) => {
    setEditingId(cls.id);
    setEditName(cls.name);
  };

  const finishEditing = () => {
    if (editingId && editName.trim()) {
      updateClass(editingId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Label Classes</h3>
        </div>
        <button
          onClick={addNewClass}
          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          title="Add new class"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
              activeClassId === cls.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            onClick={() => onActiveClassChange(cls.id)}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: cls.color }}
              />
              
              {editingId === cls.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={handleKeyPress}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-sm font-medium text-gray-900">
                  {cls.name}
                </span>
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateClass(cls.id, { visible: !cls.visible });
                  }}
                  className={`p-1 rounded transition-colors ${
                    cls.visible
                      ? 'text-gray-600 hover:text-gray-800'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={cls.visible ? 'Hide class' : 'Show class'}
                >
                  {cls.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(cls);
                  }}
                  className="p-1 text-gray-600 hover:text-blue-600 rounded transition-colors"
                  title="Edit class name"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteClass(cls.id);
                  }}
                  className="p-1 text-gray-600 hover:text-red-600 rounded transition-colors"
                  title="Delete class"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Color picker */}
            <div className="mt-2 flex flex-wrap gap-1">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateClass(cls.id, { color });
                  }}
                  className={`w-4 h-4 rounded-full border-2 ${
                    cls.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Set color to ${color}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-6">
          <Palette className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No label classes yet.</p>
          <p className="text-xs text-gray-400">Add a class to start painting.</p>
        </div>
      )}
    </div>
  );
};

export default LabelClasses;
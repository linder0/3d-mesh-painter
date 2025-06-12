import React from 'react';
import { Download, FileText, Database } from 'lucide-react';
import { MeshData, LabelClass } from '../types';

interface ExportPanelProps {
  meshData: MeshData | null;
  labelClasses: LabelClass[];
  fileName: string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ meshData, labelClasses, fileName }) => {
  const exportLabels = (format: 'json' | 'csv') => {
    if (!meshData || meshData.meshLabelVertices.size === 0) return;

    const exportData: any[] = [];
    
    meshData.meshLabelVertices.forEach((classId, vertexIndex) => {
      const labelClass = labelClasses.find(cls => cls.id === classId);
      if (!labelClass) return;

      const positions = meshData.geometry.attributes.position;
      const vertex = { x: 0, y: 0, z: 0 };
      vertex.x = positions.getX(vertexIndex);
      vertex.y = positions.getY(vertexIndex);
      vertex.z = positions.getZ(vertexIndex);

      exportData.push({
        vertexIndex,
        className: labelClass.name,
        classColor: labelClass.color,
        position: vertex
      });
    });

    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'json') {
      content = JSON.stringify({
        metadata: {
          fileName,
          totalVertices: meshData.geometry.attributes.position.count,
          labeledVertices: exportData.length,
          classes: labelClasses.map(cls => ({
            id: cls.id,
            name: cls.name,
            color: cls.color
          })),
          exportDate: new Date().toISOString()
        },
        labels: exportData
      }, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      content = 'VertexIndex,ClassName,ClassColor,X,Y,Z\n' + 
        exportData.map(item => 
          `${item.vertexIndex},${item.className},${item.classColor},${item.position.x},${item.position.y},${item.position.z}`
        ).join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mesh_labels_${fileName.split('.')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportColoredMesh = () => {
    if (!meshData) return;

    // Create PLY format with vertex colors
    const positions = meshData.geometry.attributes.position;
    const colors = meshData.vertexColors;
    
    let plyContent = `ply
format ascii 1.0
element vertex ${positions.count}
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
end_header
`;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const r = Math.round(colors[i * 3] * 255);
      const g = Math.round(colors[i * 3 + 1] * 255);
      const b = Math.round(colors[i * 3 + 2] * 255);
      
      plyContent += `${x} ${y} ${z} ${r} ${g} ${b}\n`;
    }

    const blob = new Blob([plyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colored_mesh_${fileName.split('.')[0]}.ply`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const labeledCount = meshData?.meshLabelVertices.size || 0;

  if (labeledCount === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Export</h3>
        </div>
        <div className="text-center py-6">
          <Database className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No labels to export yet.</p>
          <p className="text-xs text-gray-400">Start painting to create exportable data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Export</h3>
        <span className="text-sm text-gray-500">({labeledCount} vertices)</span>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Label Data</h4>
          <div className="flex gap-2">
            <button
              onClick={() => exportLabels('json')}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => exportLabels('csv')}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Colored Mesh</h4>
          <button
            onClick={exportColoredMesh}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PLY
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
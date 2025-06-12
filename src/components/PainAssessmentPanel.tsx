import React, { useState } from 'react';
import { User, Calendar, FileText, Star, Download, MapPin, AlertCircle, Heart } from 'lucide-react';
import { MeshData, PainAssessment } from '../types';

interface PainAssessmentPanelProps {
  meshData: MeshData | null;
  fileName: string;
}

const PainAssessmentPanel: React.FC<PainAssessmentPanelProps> = ({ 
  meshData, 
  fileName 
}) => {
  const [patientName, setPatientName] = useState('');
  const [overallDiscomfortScore, setOverallDiscomfortScore] = useState(5);
  const [notes, setNotes] = useState('');

  const markedCount = meshData?.paintedVertices.size || 0;

  const exportAssessment = () => {
    if (!meshData || markedCount === 0) return;

    const exportData = {
      metadata: {
        patientName: patientName.trim() || 'Anonymous',
        assessmentDate: new Date().toISOString(),
        meshFileName: fileName,
        totalMarkedVertices: markedCount,
        overallDiscomfortScore: overallDiscomfortScore,
        notes: notes.trim() || undefined
      },
      problemAreas: Array.from(meshData.paintedVertices.keys()).map((vertexIndex) => {
        const positions = meshData.geometry.attributes.position;
        return {
          vertexIndex,
          position: {
            x: positions.getX(vertexIndex),
            y: positions.getY(vertexIndex),
            z: positions.getZ(vertexIndex)
          }
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `problem_areas_${patientName.trim() || 'patient'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900">Pain Assessment</h3>
      </div>

      {/* Patient Information */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4" />
            Patient Name (Optional)
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4" />
            Assessment Date
          </label>
          <input
            type="text"
            value={new Date().toLocaleDateString()}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Star className="w-4 h-4" />
            Overall Discomfort Level (1-10)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="10"
              value={overallDiscomfortScore}
              onChange={(e) => setOverallDiscomfortScore(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-lg font-bold text-red-600 w-8">{overallDiscomfortScore}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>No Discomfort</span>
            <span>Severe Discomfort</span>
          </div>
        </div>
      </div>

      {/* Problem Area Statistics */}
      {markedCount > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Problem Areas Summary
          </h4>
          
          <div className="text-center mb-3">
            <div className="text-3xl font-bold text-red-600">{markedCount}</div>
            <div className="text-sm text-red-700">Areas Marked as Problematic</div>
          </div>

          <div className="bg-white p-3 rounded border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Problem Areas</span>
            </div>
            <p className="text-xs text-gray-600">
              Areas marked in red indicate regions that are currently bothering the patient and may require attention or treatment.
            </p>
          </div>
        </div>
      )}

      {/* Detailed Notes Section */}
      <div className="mb-6">
        <div className="flex items-start gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Problem Area Description
            </label>
            <p className="text-xs text-orange-700 mb-2">
              <strong>Please provide as much anatomical detail as possible.</strong> This information will be used to precisely identify and analyze problem locations.
            </p>
          </div>
        </div>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Please describe in detail:

• SPECIFIC ANATOMICAL LOCATIONS: Which exact muscles, joints, bones, or body regions are affected? (e.g., 'left trapezius muscle', 'C5-C6 cervical vertebrae', 'medial deltoid insertion point')

• SYMPTOM CHARACTERISTICS: What type of discomfort? (sharp, dull, throbbing, burning, tingling, stiffness, weakness)

• TIMING & TRIGGERS: When do problems occur? What activities or positions make it worse/better? (e.g., 'worse when lifting overhead', 'stiff in morning', 'triggered by computer work')

• RADIATION PATTERNS: Does discomfort spread to other areas? Describe the path (e.g., 'radiates from neck down left arm to fingers')

• FUNCTIONAL IMPACT: How does this affect daily activities, work, or movement patterns?

• DURATION & PROGRESSION: How long has this been present? Is it getting worse, better, or staying the same?

• PREVIOUS TREATMENTS: What has been tried before? What helped or didn't help?

• ASSOCIATED SYMPTOMS: Any numbness, weakness, swelling, or other related issues?

The more specific anatomical and clinical detail you provide, the better we can analyze and address these problem areas."
          rows={12}
          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none bg-orange-50/30"
        />
        
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-xs font-semibold text-blue-800 mb-2">💡 Tips for Better Anatomical Documentation:</h5>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Use specific anatomical terms when possible (muscle names, joint locations, etc.)</li>
            <li>• Describe the exact location relative to anatomical landmarks</li>
            <li>• Note if problems are unilateral (one side) or bilateral (both sides)</li>
            <li>• Include information about depth (superficial vs deep tissue involvement)</li>
            <li>• Mention any postural or movement patterns that affect the area</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      {markedCount > 0 ? (
        <div className="space-y-2">
          <button
            onClick={exportAssessment}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No problem areas marked yet.</p>
          <p className="text-xs text-gray-400">Start marking areas to create an assessment.</p>
        </div>
      )}
    </div>
  );
};

export default PainAssessmentPanel;
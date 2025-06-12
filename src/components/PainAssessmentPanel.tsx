import React, { useState } from 'react';
import { User, Calendar, FileText, Star, Download, MapPin, AlertCircle, Heart, Clock, Activity } from 'lucide-react';
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
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [triggers, setTriggers] = useState('');

  const markedCount = meshData?.paintedVertices.size || 0;

  const generateAISummary = () => {
    const anatomicalRegions = extractAnatomicalRegions();
    const symptomList = symptoms.split('\n').filter(s => s.trim()).map(s => s.trim());
    
    return {
      location_summary: anatomicalRegions.length > 0 
        ? `Pain labeled in ${anatomicalRegions.join(', ')} with ${markedCount} specific problem areas identified`
        : `${markedCount} problem areas marked on the 3D model`,
      symptoms: symptomList.length > 0 ? symptomList.join(', ') : extractSymptomsFromNotes(),
      severity: overallDiscomfortScore,
      duration: duration.trim() || extractDurationFromNotes(),
      triggers: triggers.trim() || extractTriggersFromNotes(),
      clinical_context: generateClinicalContext()
    };
  };

  const extractAnatomicalRegions = () => {
    const anatomicalTerms = [
      'trapezius', 'deltoid', 'bicep', 'tricep', 'forearm', 'wrist', 'hand', 'finger',
      'cervical', 'thoracic', 'lumbar', 'sacral', 'spine', 'vertebrae',
      'shoulder', 'elbow', 'hip', 'knee', 'ankle', 'foot',
      'quadriceps', 'hamstring', 'calf', 'shin', 'thigh',
      'neck', 'back', 'chest', 'abdomen', 'pelvis'
    ];
    
    const text = (notes + ' ' + symptoms + ' ' + triggers).toLowerCase();
    return anatomicalTerms.filter(term => text.includes(term));
  };

  const extractSymptomsFromNotes = () => {
    const symptomKeywords = ['pain', 'ache', 'stiff', 'sore', 'tender', 'tight', 'weak', 'numb', 'tingle', 'burn', 'throb'];
    const text = notes.toLowerCase();
    const foundSymptoms = symptomKeywords.filter(keyword => text.includes(keyword));
    return foundSymptoms.length > 0 ? foundSymptoms.join(', ') : 'Discomfort reported';
  };

  const extractDurationFromNotes = () => {
    const durationPatterns = [
      /(\d+)\s*(day|week|month|year)s?/gi,
      /(acute|chronic|recent|ongoing|persistent)/gi
    ];
    
    for (const pattern of durationPatterns) {
      const match = notes.match(pattern);
      if (match) return match[0];
    }
    return 'Duration not specified';
  };

  const extractTriggersFromNotes = () => {
    const triggerKeywords = ['trigger', 'cause', 'worse', 'aggravate', 'activity', 'movement', 'position'];
    const sentences = notes.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (triggerKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        return sentence.trim();
      }
    }
    return 'Triggers not specified';
  };

  const generateClinicalContext = () => {
    return {
      mesh_analysis: `3D anatomical model analysis with ${markedCount} precisely located problem areas`,
      assessment_method: "Direct 3D mesh painting for spatial accuracy",
      data_quality: markedCount > 0 ? "High precision vertex-level marking" : "No areas marked",
      recommended_follow_up: overallDiscomfortScore >= 7 
        ? "High severity - recommend immediate clinical evaluation"
        : overallDiscomfortScore >= 4
        ? "Moderate severity - monitor and consider intervention"
        : "Low severity - continue observation"
    };
  };

  const exportAssessment = () => {
    if (!meshData || markedCount === 0) return;

    const aiSummary = generateAISummary();
    const symptomList = symptoms.split('\n').filter(s => s.trim()).map(s => s.trim());
    
    const exportData = {
      patient: {
        name: patientName.trim() || "Anonymous Patient",
        assessment_date: new Date().toISOString(),
        mesh_filename: fileName
      },
      assessment: {
        overall_discomfort: overallDiscomfortScore,
        notes: notes.trim() || undefined,
        symptoms: symptomList.length > 0 ? symptomList : undefined,
        duration: duration.trim() || undefined,
        possible_triggers: triggers.trim() || undefined,
        total_marked_vertices: markedCount
      },
      ai_summary: aiSummary,
      marked_vertices: Array.from(meshData.paintedVertices.keys()).map((vertexIndex) => {
        const positions = meshData.geometry.attributes.position;
        return {
          index: vertexIndex,
          x: parseFloat(positions.getX(vertexIndex).toFixed(6)),
          y: parseFloat(positions.getY(vertexIndex).toFixed(6)),
          z: parseFloat(positions.getZ(vertexIndex).toFixed(6)),
          label: "problem_area"
        };
      }),
      metadata: {
        export_timestamp: new Date().toISOString(),
        application_version: "1.0.0",
        mesh_format: fileName.toLowerCase().endsWith('.stl') ? 'STL' : 'OBJ',
        coordinate_system: "normalized_mesh_space",
        ai_ready: true,
        clinical_use: true
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const patientSlug = (patientName.trim() || 'patient').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dateSlug = new Date().toISOString().split('T')[0];
    a.download = `pain_assessment_${patientSlug}_${dateSlug}.json`;
    
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

      {/* Quick Assessment Fields */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Activity className="w-4 h-4" />
            Specific Symptoms (one per line)
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="sharp pain on thumb flexion&#10;tingling in palm&#10;stiffness in morning"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4" />
            Duration
          </label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="3 weeks, 2 months, chronic, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <AlertCircle className="w-4 h-4" />
            Possible Triggers
          </label>
          <input
            type="text"
            value={triggers}
            onChange={(e) => setTriggers(e.target.value)}
            placeholder="grip-intensive tasks, computer work, lifting, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
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
            <div className="text-sm text-red-700">Vertices Marked as Problematic</div>
          </div>

          <div className="bg-white p-3 rounded border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">High-Precision Mapping</span>
            </div>
            <p className="text-xs text-gray-600">
              Each marked vertex provides precise 3D coordinates for accurate anatomical localization and AI analysis.
            </p>
          </div>
        </div>
      )}

      {/* Detailed Notes Section */}
      <div className="mb-6">
        <div className="flex items-start gap-2 mb-3">
          <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Clinical Notes
            </label>
            <p className="text-xs text-blue-700 mb-2">
              <strong>Provide comprehensive anatomical and clinical details</strong> for AI-powered analysis and treatment recommendations.
            </p>
          </div>
        </div>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detailed clinical assessment notes:

ANATOMICAL LOCATIONS:
• Specific muscles, joints, bones affected
• Unilateral vs bilateral involvement
• Depth of tissue involvement (superficial/deep)

SYMPTOM CHARACTERISTICS:
• Type: sharp, dull, throbbing, burning, tingling, stiffness
• Intensity variations throughout day
• Quality and character of discomfort

FUNCTIONAL IMPACT:
• Activities of daily living affected
• Work-related limitations
• Movement patterns compromised

TEMPORAL PATTERNS:
• Onset circumstances
• Progression over time
• Diurnal variations

AGGRAVATING/RELIEVING FACTORS:
• Specific movements or positions
• Environmental factors
• Previous treatments tried

ASSOCIATED SYMPTOMS:
• Neurological signs (numbness, weakness)
• Vascular changes (swelling, color changes)
• Systemic symptoms"
          rows={12}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none bg-blue-50/30"
        />
        
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="text-xs font-semibold text-green-800 mb-2">🤖 AI-Optimized Export Features:</h5>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Structured data format for OpenAI API integration</li>
            <li>• Precise 3D coordinates for spatial analysis</li>
            <li>• Clinical context extraction for diagnosis support</li>
            <li>• Severity scoring for treatment prioritization</li>
            <li>• Anatomical term recognition and categorization</li>
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
            Export AI-Ready Report
          </button>
          <p className="text-xs text-gray-500 text-center">
            Exports comprehensive JSON with AI summary block optimized for OpenAI API
          </p>
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
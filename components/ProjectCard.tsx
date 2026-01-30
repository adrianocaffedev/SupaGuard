
import React from 'react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onClick: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all duration-200 border ${
        isSelected 
          ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/20' 
          : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-white mb-1">{project.name}</h4>
          <p className="text-xs text-gray-500 font-mono uppercase">{project.region}</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${project.status === 'ACTIVE_HEALTHY' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500'}`} />
      </div>
    </button>
  );
};

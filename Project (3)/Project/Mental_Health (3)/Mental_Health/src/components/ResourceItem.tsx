import React from 'react';
import AccessResource from './AccessResource';

// This interface should align with the main Resource type in your application
interface Resource {
  _id: string;
  title: string;
  description: string;
  file_url: string;
  type: string;
}

interface ResourceItemProps {
  resource: Resource;
}

const ResourceItem: React.FC<ResourceItemProps> = ({ resource }) => {
  // Ensure that we don't pass undefined props
  const url = resource.file_url || '';
  const filename = resource.title || 'download';
  const resourceId = resource._id || '';

  return (
    <div className="flex items-center justify-between p-4 my-2 bg-slate-800 border border-slate-700 rounded-lg shadow-md">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-slate-700 rounded-md flex items-center justify-center">
    <span className="text-xs text-slate-400 uppercase">{resource.type || 'File'}</span>
        </div>
        <div>
          <p className="font-semibold text-white">{resource.title || 'Unnamed File'}</p>
          <p className="text-sm text-slate-400">{resource.description}</p>
        </div>
      </div>
      <AccessResource
        url={url}
        filename={filename}
        resourceId={resourceId}
      />
    </div>
  );
};

export default ResourceItem;

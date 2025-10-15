import ResourceItem from '../components/ResourceItem';

// Mock Cloudinary response objects. In a real app, you would fetch this from your backend.
const mockResources = [
  {
    // An image that should open in a new tab
    _id: '1',
    title: 'Sample Image',
    description: 'A sample image file',
    file_url: 'http://res.cloudinary.com/dovvg3pdx/image/upload/v1727180109/cld-sample-5.jpg',
    type: 'image',
  },
  {
    // A PDF that should open in a new tab
    _id: '2',
    title: 'Sample Document',
    description: 'A sample PDF document',
    file_url: 'http://res.cloudinary.com/dovvg3pdx/image/upload/v1727180108/sample.pdf',
    type: 'pdf',
  },
  {
    // An audio file that should be downloaded
    _id: '3',
    title: 'Sample Audio',
    description: 'A sample audio file',
    file_url: 'http://res.cloudinary.com/dovvg3pdx/video/upload/v1727180108/sample.mp3',
    type: 'audio',
  },
  {
    // A zip file that should be downloaded
    _id: '4',
    title: 'Sample Archive',
    description: 'A sample zip archive',
    file_url: 'http://res.cloudinary.com/dovvg3pdx/raw/upload/v1727180108/sample.zip',
    type: 'archive',
  },
];

const ResourceHubPage = () => {
  return (
    <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Resource Hub Demo</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8" role="alert">
          <p className="font-bold">Debugging Instructions</p>
          <p>1. Open your browser's DevTools (F12) and go to the <strong>Console</strong> tab.</p>
          <p>2. Click the "Open" or "Download" button for any resource below.</p>
          <p>3. Observe the `[AccessResource] clicked` log message and check for any errors.</p>
        </div>

        <div className="space-y-4">
          {mockResources.map((res, index) => (
            <ResourceItem key={index} resource={res} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceHubPage;

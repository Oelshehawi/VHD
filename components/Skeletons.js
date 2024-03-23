const shimmer = `
  before:absolute before:inset-0 before:-translate-x-full 
  before:animate-shimmer 2s infinite before:bg-gradient-to-r 
  before:from-transparent before:via-white/60 before:to-transparent
`;

export function InfoBoxSkeleton() {
  return (
    <div className={`${shimmer} relative overflow-hidden rounded-xl bg-gray-100 p-2 shadow-sm`}>
      <div className="flex flex-col space-y-4 p-4">
        {/* Simulating the title of the InfoBox */}
        <div className="h-4 w-3/4 rounded-md bg-gray-200"></div>

        {/* Simulating the main content or number in the InfoBox */}
        <div className="flex items-center justify-center truncate rounded-xl bg-white p-4">
          <div className="h-8 w-1/2 rounded-md bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}
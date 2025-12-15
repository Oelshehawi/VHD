
export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="relative">
        {/* Main spinner */}
        <div className="h-20 w-20 rounded-full border-4 border-gray-200"></div>
        <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        
        {/* Inner spinner */}
        <div className="absolute top-3 left-3 h-14 w-14 rounded-full border-2 border-gray-100"></div>
        <div className="absolute top-3 left-3 h-14 w-14 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" style={{ animationDelay: '150ms' }}></div>
        
        {/* Loading text */}
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading</h2>
          <p className="text-gray-600 text-sm">Please wait while we prepare your content...</p>
          
          {/* Loading dots animation */}
          <div className="flex justify-center space-x-1 mt-4">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
} 
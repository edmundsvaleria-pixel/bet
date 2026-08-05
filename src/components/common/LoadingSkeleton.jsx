const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  if (type === 'card') {
    return (
      <div className="space-y-3">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
              <div className="h-3 bg-gray-700 rounded w-24"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="h-4 bg-gray-700 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-700 rounded w-12"></div>
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-700 rounded w-20"></div>
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              </div>
            </div>
            <div className="mt-2 flex gap-2 justify-end">
              <div className="h-6 bg-gray-700 rounded w-12"></div>
              <div className="h-6 bg-gray-700 rounded w-12"></div>
              <div className="h-6 bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'match-details') {
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
              <div>
                <div className="h-5 bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-gray-700 rounded w-16 mt-1"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="h-8 bg-gray-700 rounded w-16"></div>
              <div className="h-3 bg-gray-700 rounded w-12 mt-1"></div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <div className="h-5 bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-gray-700 rounded w-16 mt-1"></div>
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'wallet') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-32"></div>
          </div>
          <div className="bg-card rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-32"></div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 h-12 bg-gray-700 rounded-lg"></div>
          <div className="flex-1 h-12 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return null
}

export default LoadingSkeleton
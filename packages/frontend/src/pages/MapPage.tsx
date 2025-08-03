import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../services/api'

export function MapPage() {
  const { data: clustersData, isLoading } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => searchApi.getClusters()
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Travel Map
        </h1>
        <p className="text-gray-600">
          Interactive map showing your photo clusters by location
        </p>
      </div>

      <div className="card p-8">
        {isLoading ? (
          <div className="map-container bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <div className="map-container bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Interactive Mapbox map will be rendered here</p>
              <p className="text-sm text-gray-500">
                Found {clustersData?.totalClusters || 0} photo clusters
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
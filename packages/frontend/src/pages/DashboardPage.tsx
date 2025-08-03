import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Calendar, MapPin, Users } from 'lucide-react'
import { photosApi, searchApi } from '../services/api'

export function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: photosData, isLoading } = useQuery({
    queryKey: ['photos', { limit: 12 }],
    queryFn: () => photosApi.getPhotos({ limit: 12 })
  })

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchApi.search(searchQuery),
    enabled: searchQuery.length > 2
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Search results will be handled by React Query
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Your Travel Memories
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Search through your photos using natural language. Try "beach photos from 2023" or "photos with my cousin in Paris"
        </p>
      </div>

      {/* Smart Search */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Where did I go in 2023 with my cousin?"
            className="input pl-10 text-lg h-12"
          />
        </form>
        
        {searchResults && searchQuery.length > 2 && (
          <div className="mt-4 card p-4">
            <h3 className="font-semibold mb-2">Search Results ({searchResults.pagination?.total || 0})</h3>
            <div className="photo-grid">
              {searchResults.data?.slice(0, 8).map((photo: any) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.thumbnailUrl || photo.originalUrl}
                    alt={photo.aiDescription || 'Photo'}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <Calendar className="mx-auto text-primary-600 mb-2" size={32} />
          <div className="text-2xl font-bold text-gray-900">2023</div>
          <div className="text-sm text-gray-600">Active Year</div>
        </div>
        <div className="card p-6 text-center">
          <MapPin className="mx-auto text-green-600 mb-2" size={32} />
          <div className="text-2xl font-bold text-gray-900">{photosData?.pagination?.total || 0}</div>
          <div className="text-sm text-gray-600">Total Photos</div>
        </div>
        <div className="card p-6 text-center">
          <Users className="mx-auto text-blue-600 mb-2" size={32} />
          <div className="text-2xl font-bold text-gray-900">AI</div>
          <div className="text-sm text-gray-600">Smart Analysis</div>
        </div>
        <div className="card p-6 text-center">
          <Search className="mx-auto text-purple-600 mb-2" size={32} />
          <div className="text-2xl font-bold text-gray-900">Natural</div>
          <div className="text-sm text-gray-600">Language Search</div>
        </div>
      </div>

      {/* Recent Photos */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Photos</h2>
        {isLoading ? (
          <div className="photo-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="photo-grid">
            {photosData?.data?.map((photo: any) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.thumbnailUrl || photo.originalUrl}
                  alt={photo.aiDescription || 'Photo'}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-white bg-opacity-90 rounded p-2 text-xs">
                    <div className="font-medium truncate">{photo.location || 'Unknown location'}</div>
                    {photo.dateTaken && (
                      <div className="text-gray-600">
                        {new Date(photo.dateTaken).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
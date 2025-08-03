import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Camera, CheckCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { photosApi } from '../services/api'

export function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: photosApi.uploadBatch,
    onSuccess: (data) => {
      toast.success(`${data.data.length} photos uploaded successfully!`)
      setUploadedFiles(data.data.map((photo: any) => photo.fileName))
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      setUploading(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Upload failed')
      setUploading(false)
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploading(true)
      uploadMutation.mutate(acceptedFiles)
    }
  }, [uploadMutation])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxFiles: 20
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Photos
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload your travel photos and let AI automatically analyze them for locations, people, and content.
          We'll extract GPS data and create searchable memories.
        </p>
      </div>

      {/* Upload Area */}
      <div className="max-w-2xl mx-auto">
        <div
          {...getRootProps()}
          className={`card p-12 text-center cursor-pointer transition-colors border-2 border-dashed ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-lg font-medium text-gray-900">
                Uploading and analyzing photos...
              </p>
              <p className="text-sm text-gray-600">
                This may take a moment while we process your images
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {isDragActive ? (
                <>
                  <Upload className="mx-auto text-primary-600" size={64} />
                  <p className="text-lg font-medium text-primary-600">
                    Drop your photos here!
                  </p>
                </>
              ) : (
                <>
                  <Camera className="mx-auto text-gray-400" size={64} />
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drag & drop photos here, or click to browse
                    </p>
                    <p className="text-sm text-gray-600">
                      Supports JPEG, PNG, WebP up to 10MB each (max 20 files)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Success */}
      {uploadedFiles.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="card p-6 border-green-200 bg-green-50">
            <div className="flex items-center space-x-3 text-green-800">
              <CheckCircle size={24} />
              <div>
                <h3 className="font-semibold">Upload Complete!</h3>
                <p className="text-sm">
                  {uploadedFiles.length} photos uploaded and are being processed by AI
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Uploaded Files:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {uploadedFiles.map((fileName, index) => (
                  <div key={index} className="text-sm text-green-700 flex items-center space-x-2">
                    <CheckCircle size={16} />
                    <span>{fileName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Camera className="text-blue-600" size={32} />
          </div>
          <h3 className="font-semibold mb-2">AI Analysis</h3>
          <p className="text-sm text-gray-600">
            Automatic scene recognition and content tagging using GPT-4 Vision
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="text-green-600" size={32} />
          </div>
          <h3 className="font-semibold mb-2">Location Detection</h3>
          <p className="text-sm text-gray-600">
            Extract GPS coordinates and reverse geocode to readable locations
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="text-purple-600" size={32} />
          </div>
          <h3 className="font-semibold mb-2">Face Recognition</h3>
          <p className="text-sm text-gray-600">
            Identify and group people in your photos using AWS Rekognition
          </p>
        </div>
      </div>
    </div>
  )
}
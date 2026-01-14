'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (data: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isScanning = useRef(false)
  const [scanMode, setScanMode] = useState<'camera' | 'file'>('camera')
  const [error, setError] = useState<string>('')
  
  const startScanner = async () => {
    try {
      setError('')
      isScanning.current = true
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText)
          stopScanner()
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      )
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('Camera access denied or not available. Try uploading an image instead.')
      isScanning.current = false
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && isScanning.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
        isScanning.current = false
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }
  useEffect(() => {
    if (scanMode === 'camera' && !isScanning.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startScanner()
    }

    return () => {
      stopScanner()
    }
  }, [scanMode])


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError('')
      const scanner = new Html5Qrcode('qr-file-reader')
      
      const decodedText = await scanner.scanFile(file, true)
      onScan(decodedText)
      scanner.clear()
    } catch (err) {
      console.error('Error scanning file:', err)
      setError('Could not read QR code from image. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setScanMode('camera')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            scanMode === 'camera'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📷 Camera
        </button>
        <button
          onClick={() => {
            stopScanner()
            setScanMode('file')
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            scanMode === 'file'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🖼️ Upload
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Camera Mode */}
      {scanMode === 'camera' && (
        <div>
          <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
          <p className="text-xs text-center text-gray-500 mt-2">
            Position the QR code within the frame
          </p>
        </div>
      )}

      {/* File Upload Mode */}
      {scanMode === 'file' && (
        <div>
          <div id="qr-file-reader" className="hidden"></div>
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-12 h-12 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag QR code image
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </label>
          <p className="text-xs text-center text-gray-500 mt-2">
            Upload a screenshot or photo of a QR code
          </p>
        </div>
      )}
    </div>
  )
}

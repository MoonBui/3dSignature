import { useState } from 'react'
import './App.css'
import SignatureCapture from './components/SignatureCapture'
import SignatureRecreate from './components/SignatureRecreate'
import type { Point } from './types/signature'
import SignatureModel from './components/SignatureModel'

function App() {
  const [signatureData, setSignatureData] = useState<Point[]>([])
  const [originalSize, setOriginalSize] = useState<{width: number, height: number} | null>(null)

  const handleSignatureComplete = (data: Point[], width: number, height: number) => {
    setSignatureData(data)
    setOriginalSize({ width, height })
  }

  return (
    <div className="min-w-[300px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[800px] xl:min-w-[1000px] 2xl:min-w-[1200px] w-full max-w-[2000px] mx-auto space-y-4">
      <SignatureCapture 
        onSignatureComplete={handleSignatureComplete}
        isRecording={true}
        width={800}
        height={400}
      />
      
      {signatureData.length > 0 && originalSize && (
        <>
          <SignatureRecreate 
            signatureData={signatureData}
            originalWidth={originalSize.width}
            originalHeight={originalSize.height}
          />
          <SignatureModel
            signatureData={signatureData}
            width={originalSize.width}
            height={originalSize.height}
          />
        </>
      )}
    </div>
  )
}

export default App

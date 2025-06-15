import { useState } from 'react'
import './App.css'
import SignatureCapture from './components/SignatureCapture'
import SignatureRecreate from './components/SignatureRecreate'
import type { Point } from './types/signature'

function App() {
  const [signatureData, setSignatureData] = useState<Point[]>([])

  return (
    <div className="min-w-[300px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[800px] xl:min-w-[1000px] 2xl:min-w-[1200px] w-full max-w-[2000px] mx-auto p-4 space-y-8">
      <SignatureCapture 
        onSignatureComplete={setSignatureData}
        isRecording={true}
        width={800}
        height={400}
      />
      
      {signatureData.length > 0 && (
        <>
          <SignatureRecreate 
            signatureData={signatureData}
            width={800}
            height={400}
          />
        </>
      )}
    </div>
  )
}

export default App

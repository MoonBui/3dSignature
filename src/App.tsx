import { useState } from 'react'
import './App.css'
import SignatureCapture from './components/SignatureCapture'
import SignatureRecreate from './components/SignatureRecreate'
import type { Point } from './types/signature'

function App() {
  const [signatureData, setSignatureData] = useState<Point[]>([])

  return (
    <div className="container mx-auto p-4 space-y-8">
      <SignatureCapture 
        onSignatureComplete={setSignatureData}
        isRecording={true}
        width={400}
        height={200}
      />
      
      {signatureData.length > 0 && (
        <SignatureRecreate 
          signatureData={signatureData}
          width={400}
          height={200}
        />
      )}
    </div>
  )
}

export default App

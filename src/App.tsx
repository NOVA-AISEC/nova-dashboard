import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { DemoGate } from '@/demo/DemoGate'
import { AuthProvider } from '@/lib/auth'

export default function App() {
  return (
    <DemoGate>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </DemoGate>
  )
}

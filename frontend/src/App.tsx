import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useAuth } from './context/AuthContext'

function App() {
  const { accessToken, login, logout } = useAuth();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Tailwind is Working!</h1>

      {/* Auth Test Section*/}
      <p className="text-gray-700">Access Token: {accessToken || 'None'}</p>
      <div className="space-x-4 mt-4">
        <button
          onClick={() => login('dummyAccess', 'dummyRefresh')}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Login
        </button>

        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;



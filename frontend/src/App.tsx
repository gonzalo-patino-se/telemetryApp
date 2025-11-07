import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useAuth } from './context/AuthContext'
import api from './services/api'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'

// function App() {
//   const { accessToken, login, logout } = useAuth();

//   const testApiCall = async () => {
//     try {
//       const response = await api.post('/search_serial/', { serial: '12345' }); // Replace with your endpoint and data
//       console.log('API Response:', response.data);
//     } catch (error) {
//       console.error('API Error:', error);
//     }
//   };


//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-100">
//       <h1 className="text-4xl font-bold text-blue-600">Tailwind is Working!</h1>
//       <LoginForm />
//       {/* Auth Test Section*/}
//       <p className="text-gray-700">Access Token: {accessToken || 'None'}</p>
//       <div className="space-x-4 mt-4">
//         <button
//           onClick={() => login('dummyAccess', 'dummyRefresh')}
//           className="px-4 py-2 bg-green-500 text-white rounded"
//         >
//           Login
//         </button>

//         <button
//           onClick={logout}
//           className="px-4 py-2 bg-red-500 text-white rounded"
//         >
//           Logout
//         </button>

//         <button
//           onClick={testApiCall}
//           className="px-4 py-2 bg-blue-500 text-white rounded"
//         >
//           Test API Call
//         </button> 
//       </div>
//     </div>
//   );
// }

function App() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <RegisterForm />
    </div>
  );
}

export default App;



import React from 'react'
import { useNavigate } from 'react-router-dom';
const Homepage = () => {
    const navigate = useNavigate();
  return (
    
    <div>
      <h1 className='text-4xl font-bold'>This is a landing page</h1>
      <button className='bg-green-500 text-white px-4 py-2 rounded-md' onClick={() => navigate('/login')}>Sign in</button>
    </div>
  )
}

export default Homepage

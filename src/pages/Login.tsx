import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Lock, User } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useUser } from '../context/UserContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }
    
    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      // Update user context
      login({
        id: user.uid,
        name: userData?.name || '',
        email: user.email || ''
      });

      navigate('/');
    } catch (error: any) {
      setError(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative flex-1 flex flex-col md:flex-row">
        {/* Left side - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-2">
                <Pill className="h-10 w-10 text-blue-500" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
                MediMate
              </h1>
              <p className="text-gray-600 mt-2">Your Smart Pill Companion</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full btn btn-primary mb-4"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
              </form>
              
              <p className="text-center mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-800">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side - Image & Info */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-500 to-emerald-500 relative">
          <div className="absolute inset-0 opacity-20" style={{ 
            backgroundImage: 'url("https://images.pexels.com/photos/593451/pexels-photo-593451.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'overlay'
          }}></div>
          <div className="relative z-10 flex flex-col justify-center items-center h-full text-white p-12">
            <h2 className="text-4xl font-bold mb-6">Never Miss a Pill Again</h2>
            <div className="max-w-md">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold mb-2">Smart Tracking</h3>
                <p>MediMate uses advanced AI to ensure you take your medications on time, every time.</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold mb-2">Secure Login</h3>
                <p>Your medication schedule is private and personalized with secure authentication.</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-2">AI Verification</h3>
                <p>Our advanced system verifies that you've actually taken your medication as prescribed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import login from './login.module.css';
import { signIn } from 'next-auth/react';


const LoginPage = () => {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setIsLoading(true); 

    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (result.error) {
      console.error('Error during authentication:', result.error);
      setSignInError(result.error);
    } else {
      router.push('/dashboard');
    }

    setIsLoading(false); 
  }
  return (
    <div className={`flex justify-center items-center ${login.background} w-full h-full`}>
  <div className="w-full">
    <div className={`w-full ${login.loginCard}`}>
      <div className="text-center font-bold text-2xl my-5">
        Vancouver Hood Doctors
      </div>
      <form
        className="flex flex-col p-5 pt-0"
        onSubmit={onSubmit}
        noValidate
      >
        <label className="block mb-3">
          <span className="block text-sm font-medium text-gray-700">Username</span>
          <input
            required
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${signInError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
          />
          {signInError && (
            <p className="mt-2 text-sm text-red-600">
              {username ? 'Incorrect username or password.' : 'Please enter a username.'}
            </p>
          )}
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700">Password</span>
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${signInError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
          />
          {signInError && (
            <p className="mt-2 text-sm text-red-600">
              {password ? 'Incorrect username or password.' : 'Please enter a password.'}
            </p>
          )}
        </label>
        <button
          type="submit"
          className={`mt-4 ${login.loginButton} inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Logging in...</span>
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>
    </div>
  </div>
</div>
  );
};

export default LoginPage;

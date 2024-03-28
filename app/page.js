'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import login from './login.module.css';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

const LoginPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm();

  const onSubmit = async ({ username, password }) => {
    setIsLoading(true);
    console.log(username);
    console.log(password);
    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (result.error) {
      setIsLoading(false);
      console.error('Error during authentication:', result.error);
      setError('signInError', {
        type: 'manual',
        message: result.error,
      });
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div
      className={`flex justify-center items-center ${login.background} w-full h-full`}
    >
      <div className='flex justify-center w-full '>
        <div className={`w-1/3 ${login.loginCard}`}>
          <div className='text-center font-bold text-2xl my-5'>
            Vancouver Hood Doctors
          </div>
          <form
            className='flex flex-col p-5 pt-0'
            onSubmit={handleSubmit(onSubmit)}
          >
            <label className='block mb-3'>
              <span className='block text-sm font-medium text-gray-700'>
                Username
              </span>
              <input
                {...register('username', {
                  required: 'Please enter a username.',
                })}
                type='text'
                placeholder='Username'
                onChange={(e) => {
                  register('username').onChange(e);
                  clearErrors('signInError');
                }}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
              />
              {(errors.username || errors.signInError) && (
                <p className='mt-2 text-sm text-red-600'>
                  {errors.username?.message ||
                    'Incorrect username or password.'}
                </p>
              )}
            </label>
            <label className='block'>
              <span className='block text-sm font-medium text-gray-700'>
                Password
              </span>
              <input
                {...register('password', {
                  required: 'Please enter a password.',
                })}
                type='password'
                placeholder='Password'
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                onChange={(e) => {
                  register('password').onChange(e);
                  clearErrors('signInError');
                }}
              />
              {(errors.password || errors.signInError) && (
                <p className='mt-2 text-sm text-red-600'>
                  {errors.password?.message ||
                    'Incorrect username or password.'}
                </p>
              )}
            </label>
            <button
              type='submit'
              className={`mt-4 ${login.loginButton} inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

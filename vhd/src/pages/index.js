'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import login from './login.module.css';
import { FaGoogle } from 'react-icons/fa';
import { FaFacebook } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import axios from 'axios';
import { API_URL } from '../config';

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const router = useRouter();

  const inputFields = [
    {
      name: 'Username',
      id: 'username',
    },
    {
      name: 'Password',
      id: 'password',
    },
  ];

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/users/checkAdmin`, data);
      // Check the response data for isAdmin status
  
        // Authentication successful, redirect to the dashboard page
        router.push('/dashboard');
     
    } catch (error) {
      // Handle any errors that occur during the authentication process
      console.error('Error during authentication:', error);
    }
  };

  return (
    <div className={login.main}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={login.formContainer}>
          {inputFields.map(({ name, type, id, placeholder }) => (
            <div key={name} className={login.inputContainer}>
              <input
                key={name}
                id={id}
                {...register(id, { required: true })}
                className={login.inputLogin}
                placeholder={name}
              />
              <span className={login.error}>
                {errors[id] && name + ' is required'}
              </span>
            </div>
          ))}
        </div>
        <div className={login.buttonContainer}>
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;

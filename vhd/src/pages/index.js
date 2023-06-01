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

  console.log('words');

  const onSubmit = (data) => {
    console.log('before response');
    axios
      .post(`${API_URL}/users/checkAdmin`, data)
      .then((response) => {
        console.log('after response');
        // Check the response data for isAdmin status
        const { isAdmin, error } = response.data;
        console.log(response.data);
        if (isAdmin) {
          // Authentication successful, redirect to the dashboard page
          router.replace('/dashboard');
        } else {
          // Authentication failed, handle the error
          alert(error);
        }
      })
      .catch((error) => {
        // Handle any errors that occur during the authentication process
        if (error.response) {
          // The request was made and the server responded with an error status
          console.error('Error during authentication:', error.response.data);
          alert(error.response.data.error);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          alert('No response received from the server.');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up the request:', error.message);
          alert('Error setting up the request.');
        }
      });
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

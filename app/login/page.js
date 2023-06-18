'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import login from './login.module.css';
import axios from 'axios';

const LoginPage = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

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

  const onSubmit = (data) => {
    axios
      .post(`${process.env.NEXT_PUBLIC_API_URL}/users/checkAdmin`, data)
      .then((response) => {
        const { isAdmin, error } = response.data;
        console.log(response.data);
        if (isAdmin) {
          router.replace('/database');
        } else {
          res.status(401);
          alert(error);
        }
      })
      .catch((error) => {
        if (error.response) {
          console.error('Error during authentication:', error.response.data);
          alert(error.response.data.error);
        } else if (error.request) {
          console.error('No response received:', error.request);
          alert('No response received from the server.');
        } else {
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

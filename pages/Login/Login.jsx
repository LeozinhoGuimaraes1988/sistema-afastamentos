import React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import styles from '../Login/Login.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import {
  registerWithEmailAndPassword,
  loginWithGoogle,
} from '../../authentication/auth';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const { currentUser } = useAuth();

  // Criando a validação do formulário
  const schemaValidation = Yup.object().shape({
    email: Yup.string()
      .email('Digite um e-mail válido')
      .required('O campo Email é obrigatório'),
    password: Yup.string()
      .min(4, 'A senha precisa ter 4 caracteres')
      .required('O campo Senha é obrigatório'),
  });

  // Usando o hook useForm e vinculando o schema do Yup com yupResolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schemaValidation) });

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await registerWithEmailAndPassword(data.email, data.password);
      alert('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      alert('Erro ao realizar login. Verifique suas credenciais.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      console.log('Login com Google realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.log('Erro ao realizar login com Google.');
    }
  };

  useEffect(() => {
    Object.values(errors).forEach((error) => {
      alert(error.message);
    });
  }, [errors]);

  React.useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.content}>
        <h1>Sistema de Gerenciamento de Afastamentos</h1>
        <p>Acesse sua conta</p>

        <input {...register('email')} placeholder="Digite seu e-mail" />
        <input
          {...register('password')}
          placeholder="Digite sua senha"
          type="password"
        />

        <div className={styles.buttons}>
          <button type="submit" className={styles.enter}>
            Entrar
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className={styles.googleLogin}
          >
            Entrar com Google
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;

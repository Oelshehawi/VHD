'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import login from './login.module.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Spinner from 'react-bootstrap/Spinner';
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
    <Container
      fluid
      className={`d-flex justify-content-center align-items-center ${login.background}`}
    >
      <Row>
        <Col xs={12}>
          <Container fluid className={`${login.loginCard}`}>
            <Col className="text-center fw-bolder fs-4 m-5">
              Vancouver Hood Doctors
            </Col>
            <Form
              noValidate
              className="d-flex flex-column p-5 pt-0"
              onSubmit={onSubmit}
            >
              <FloatingLabel
                controlId="floatingInput"
                label="Username"
                className="mb-3"
              >
                <Form.Control
                  required
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  isInvalid={signInError}
                />
                <Form.Control.Feedback type="invalid">
                  {username
                    ? 'Incorrect username or password.'
                    : 'Please enter a username.'}
                </Form.Control.Feedback>
              </FloatingLabel>
              <FloatingLabel controlId="floatingPassword" label="Password">
                <Form.Control
                  required
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  isInvalid={signInError}
                />
                <Form.Control.Feedback type="invalid">
                  {password
                    ? 'Incorrect username or password.'
                    : 'Please enter a password.'}
                </Form.Control.Feedback>
              </FloatingLabel>
              <Button
                variant="primary"
                type="submit"
                className={`mt-4 ${login.loginButton}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-2">Logging in...</span>
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </Form>
          </Container>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;

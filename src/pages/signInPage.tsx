import React from 'react';
import SignInForm from '../components/SignInForm';
import AuthLayout from '../layout/AuthLayout';
import TroscLogo from "../../assets/Trosc4x1.png";
import usePageTitle from "../hooks/usePageTitle";

const SignInPage: React.FC = () => {
  usePageTitle("Sign in");
  return (
    <AuthLayout logo={TroscLogo}>
      <SignInForm />
    </AuthLayout>
  );
};

export default SignInPage;

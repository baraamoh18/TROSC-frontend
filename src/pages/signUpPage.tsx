import React from 'react';
import SignUpForm from '../components/SignUpForm';
import AuthLayout from '../layout/AuthLayout';
import TroscLogo from "../../assets/Trosc4x1.png";
import usePageTitle from "../hooks/usePageTitle";

const SignUpPage: React.FC = () => {
  usePageTitle("Sign up");
  return (
    <AuthLayout logo={TroscLogo}>
      <SignUpForm />
    </AuthLayout>
  );
};

export default SignUpPage;

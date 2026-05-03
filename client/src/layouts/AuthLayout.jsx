import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#162a66] px-4 py-10 sm:px-6">
      <div className="w-full max-w-6xl rounded-[2.5rem] bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-10">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
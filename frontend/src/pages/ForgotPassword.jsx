import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/forgot-password/`, {
        email,
      });
      setResetToken(res.data.reset_token);
      setStep(2);
      setMessage("Verification code sent to your email");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post(`/verify-forgot-otp/`, {
        otp,
        reset_token: resetToken,
      });
      setStep(3);
      setMessage("Code verified successfully");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.post(`/reset-password/`, {
        new_password: newPassword,
        confirm_password: confirmPassword,
        reset_token: resetToken,
      });

      setMessage("Password reset successful");
      setStep(4);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden px-4">
      {/* Railway Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 opacity-5 railway-pattern"></div>
      </div>

      {/* Railway Lines */}
      <div className="absolute inset-0">
        <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
          <div className="flex justify-between mt-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-px h-3 bg-amber-500/10"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Railway<span className="text-amber-500">Connect</span>
              </h1>
              <p className="text-gray-400 text-sm">Password Recovery</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Reset Your Password</h2>
                <p className="text-gray-400 text-sm mt-1">Follow the steps to secure your account</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${loading ? 'animate-pulse bg-red-500' : 'bg-amber-500'}`}></div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="px-8 pt-8">
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex flex-col items-center relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${step >= stepNumber
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                    : 'bg-gray-700 text-gray-500'
                    }`}>
                    {step > stepNumber ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : (
                      <span className="font-semibold text-sm">{stepNumber}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${step >= stepNumber ? 'text-amber-400' : 'text-gray-500'}`}>
                    {stepNumber === 1 && 'Email'}
                    {stepNumber === 2 && 'Verify'}
                    {stepNumber === 3 && 'Reset'}
                    {stepNumber === 4 && 'Done'}
                  </span>
                  {stepNumber < 4 && (
                    <div className={`absolute top-4 left-10 w-12 h-0.5 ${step > stepNumber ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gray-700'}`}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Status Messages */}
            {message && (
              <div className="mb-6 p-4 bg-gradient-to-r from-amber-900/20 to-amber-800/10 border border-amber-700/30 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-amber-300 text-sm">{message}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-700/30 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Step 1: Email Input */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your registered email"
                      className="w-full pl-11 pr-4 py-3 rounded-lg bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    We'll send a verification code to this email
                  </p>
                </div>

                <button
                  onClick={sendOtp}
                  disabled={loading || !email}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${loading || !email
                    ? 'bg-gray-700 cursor-not-allowed opacity-80'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg hover:shadow-xl'
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Code...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                      Send Verification Code
                    </span>
                  )}
                </button>

                <div className="text-center pt-4 border-t border-gray-700/50">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-amber-400 hover:text-amber-300 font-medium transition flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Back to Login
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      className="w-full pl-11 pr-4 py-3 rounded-lg bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200 text-center tracking-widest"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Enter the code sent to {email}
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 rounded-lg border border-gray-600 text-gray-300 hover:border-amber-500 hover:text-amber-400 transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={verifyOtp}
                    disabled={loading || otp.length < 6}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${loading || otp.length < 6
                      ? 'bg-gray-700 cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                      }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Verify Code
                      </span>
                    )}
                  </button>
                </div>

                <div className="text-center pt-4 border-t border-gray-700/50">
                  <button
                    onClick={sendOtp}
                    className="text-amber-400 hover:text-amber-300 text-sm font-medium transition"
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full pl-11 pr-4 py-3 rounded-lg bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full pl-11 pr-4 py-3 rounded-lg bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Use at least 8 characters with letters and numbers
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 px-4 rounded-lg border border-gray-600 text-gray-300 hover:border-amber-500 hover:text-amber-400 transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={resetPassword}
                    disabled={loading || !newPassword || !confirmPassword}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${loading || !newPassword || !confirmPassword
                      ? 'bg-gray-700 cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                      }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                        Reset Password
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="text-center py-8 animate-fadeIn">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Password Reset Successful!</h3>
                <p className="text-gray-400 mb-6">
                  Your password has been updated successfully. You will be redirected to login shortly.
                </p>
                <div className="flex items-center justify-center text-amber-400 font-medium">
                  <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                  Redirecting to login...
                </div>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="px-8 py-6 bg-gray-900/30 border-t border-gray-700/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                <span>Secure Recovery Process</span>
              </div>
              <div className="text-gray-500">
                Need help? <a href="/support" className="text-amber-400 hover:text-amber-300">Contact Support</a>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            Your account security is our top priority
          </p>
        </div>
      </div>

      {/* Background Animation */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"></div>

      {/* Add CSS Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
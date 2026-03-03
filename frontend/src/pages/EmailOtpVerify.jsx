
import { useState, useEffect, useRef, useCallback } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/Api";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Mail, Clock, Shield, RefreshCw, ArrowRight, Check, Lock } from "lucide-react";

const OTPVerify = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const inputRef = useRef(null);

  const registration_id = location.state?.registration_id;

  useEffect(() => {
    if (!registration_id) {
      navigate("/email-register", { replace: true });
    }
  }, [registration_id, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;

    


    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleOtpChange = (e) => {
    if (/^\d*$/.test(e.target.value)) {
      setOtp(e.target.value);
      setError("");
    }
  };

  const verifyOTP = useCallback(async () => {
  if (otp.length !== 6) {
    setError("OTP must be exactly 6 digits");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const res = await api.post("/email-verify/", {
      registration_id,
      otp,
    });

    login(res.data);
    navigate("/", { replace: true });
  } catch (err) {
    const data = err.response?.data;
    setError(
      data?.error ||
      (typeof data === "string" ? data : "OTP verification failed")
    );
  } finally {
    setLoading(false);
  }
}, [otp, registration_id, login, navigate]);


  const resendOTP = async () => {
    try {
      setResendLoading(true);
      setError("");

      await api.post("/resend-email-otp/", {
        registration_id,
      });

      setCooldown(30);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  // Auto submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !loading) {
      const timer = setTimeout(() => {
        verifyOTP();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [otp, loading,verifyOTP]);

  useEffect(() => {
  inputRef.current?.focus();
}, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">

        <div className="absolute top-20 left-10">
          <BookOpen size={60} className="text-gray-400" />
        </div>
        <div className="absolute bottom-20 right-10">
          <BookOpen size={60} className="text-gray-400" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-gray-300 rounded-full"
            style={{
              top: `${20 + i * 10}%`,
              left: `${5 + i * 12}%`,
              transform: `rotate(${i * 45}deg)`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md">
              <BookOpen size={40} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Read<span className="text-blue-600">Wise</span>
              </h1>
              <p className="text-gray-600 text-lg">Secure Your Reading Journey</p>
            </div>
          </div>
          <div className="max-w-xl mx-auto">
            <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-6"></div>
            <p className="text-gray-700 text-lg">
              Enter the verification code to unlock your reading experience
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress & Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 h-full">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Shield size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Secure Verification</h3>
                    <p className="text-gray-600 text-sm">Two-factor authentication enabled</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Registration</p>
                      <p className="text-gray-500 text-sm">Account details submitted</p>
                    </div>
                    <div className="ml-auto">
                      <Check size={20} className="text-green-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                      <span className="font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email Verification</p>
                      <p className="text-gray-500 text-sm">Enter OTP sent to your email</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Complete Setup</p>
                      <p className="text-gray-400 text-sm">Personalize your experience</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-lg">What's Next?</h4>
                {[
                  "Access to 1M+ books",
                  "Personalized recommendations",
                  "Offline reading",
                  "Join reading communities"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center">
                      <Check size={14} className="text-blue-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column - OTP Verification */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Verification
                </h2>
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail size={18} />
                  <span>We've sent a 6-digit code to your email address</span>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center justify-center text-red-600 font-medium">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </div>
                </div>
              )}

              {/* OTP Input */}
              <div className="mb-10">
                <label className="block text-sm font-semibold text-gray-900 mb-6 text-center">
                  Enter Verification Code
                </label>

                {/* Visual OTP Boxes */}
                <div
  className="flex justify-center gap-4 mb-8 cursor-text"
  onClick={() => inputRef.current?.focus()}
>

                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="relative">
                      <div className={`
                        w-16 h-20 rounded-lg flex items-center justify-center
                        border-2 transition-all duration-200 shadow-sm
                        ${index < otp.length
                          ? 'border-blue-500 bg-blue-50 shadow-blue-100'
                          : 'border-gray-300 bg-gray-50'
                        }
                        ${index === otp.length ? 'ring-2 ring-blue-200' : ''}
                      `}>
                        <span className="text-3xl font-bold text-gray-900">
                          {otp[index] || ""}
                        </span>
                        {index < otp.length && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <Lock size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                        <div className={`w-1 h-1 rounded-full ${
                          index < otp.length ? 'bg-blue-500' : 'bg-gray-300'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hidden Input */}
                <input
                 ref={inputRef}
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  placeholder="000000"
                  className="sr-only"
                  autoFocus
                />

                {/* Instructions */}
                <div className="text-center mb-2">
                  <p className="text-gray-600 text-sm">
                    Type the 6-digit code (auto-submits when complete)
                  </p>
                </div>
              </div>

              {/* Manual Verification Button */}
              <button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                  flex items-center justify-center gap-3 mb-8
                  ${loading || otp.length !== 6
                    ? 'bg-gray-200 cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }
                `}
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <span>Verify & Continue Reading</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* Resend Section */}
              <div className="pt-8 border-t border-gray-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Clock size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {cooldown > 0 ? `Code expires in 00:${cooldown.toString().padStart(2, '0')}` : "Ready for new code"}
                      </p>
                      <p className="text-sm text-gray-600">Check spam folder if not received</p>
                    </div>
                  </div>

                  {cooldown > 0 ? (
                    <div className="px-6 py-3 bg-gray-100 rounded-xl">
                      <p className="text-gray-700 font-medium">
                        Resend in <span className="text-gray-900">{cooldown}s</span>
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={resendOTP}
                      disabled={resendLoading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
                    >
                      {resendLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={18} />
                          Resend Verification Code
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Need help?{" "}
                <button
                  onClick={() => navigate("/help")}
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                >
                  Contact Support
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">10M+</div>
            <div className="text-gray-600">Readers Verified</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">99.9%</div>
            <div className="text-gray-600">Verification Success</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">Instant</div>
            <div className="text-gray-600">Code Delivery</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">Secure</div>
            <div className="text-gray-600">256-bit Encryption</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerify;
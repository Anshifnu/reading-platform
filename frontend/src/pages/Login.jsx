import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/Api";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Mail, Lock, Shield, Clock, ArrowRight, UserPlus, Key, RefreshCw } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ======================
  // STATE
  // ======================
  const [step, setStep] = useState("LOGIN"); // LOGIN | OTP
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // ======================
  // OTP TIMER
  // ======================
  useEffect(() => {
    if (step === "OTP" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, timer]);

  // ======================
  // VALIDATION
  // ======================
  const validateLogin = () => {
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    return null;
  };

  // ======================
  // STEP 1: LOGIN → SEND OTP
  // ======================
  const handleLogin = async (e) => {
    e.preventDefault();

    const error = validateLogin();
    if (error) {
      setServerError(error);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      await api.post("/login/", { email, password });
      setStep("OTP");
      setTimer(60);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // STEP 2: VERIFY OTP
  // ======================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      setServerError("OTP is required");
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      const res = await api.post("/verify-otp/", {
        email,
        otp,
      });

      login(res.data);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // STEP 3: RESEND OTP
  // ======================
  const handleResendOtp = async () => {
    setResendLoading(true);
    setServerError("");

    try {
      await api.post("/login/", { email, password });
      setTimer(60);
      setOtp(""); // clear previous otp
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to resend OTP"
      );
    } finally {
      setResendLoading(false);
    }
  };

  // ======================
  // UI
  // ======================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md">
              <BookOpen size={48} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Read<span className="text-blue-600">Wise</span>
              </h1>
              <p className="text-gray-600 text-lg md:text-xl mt-2">
                Your Gateway to Infinite Knowledge
              </p>
            </div>
          </div>
          <div className="max-w-xl mx-auto">
            <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-6"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Features */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 h-full">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Shield size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Secure Login</h3>
                    <p className="text-gray-600 text-sm">Two-factor authentication enabled</p>
                  </div>
                </div>

                <h4 className="font-bold text-gray-900 text-lg mb-4">Why ReadWise?</h4>
                <div className="space-y-4">
                  {[
                    { icon: "📚", text: "Access to 1M+ books and articles" },
                    { icon: "🎯", text: "Personalized reading recommendations" },
                    { icon: "📱", text: "Read anywhere, on any device" },
                    { icon: "👥", text: "Join global reading communities" },
                    { icon: "🏆", text: "Track reading milestones" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-lg">
                        {item.icon}
                      </div>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">10M+</div>
                  <div className="text-gray-600 text-sm">Readers</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">99%</div>
                  <div className="text-gray-600 text-sm">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Login Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === "LOGIN"
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Login</p>
                    <p className="text-gray-500 text-sm">Enter credentials</p>
                  </div>
                </div>

                <div className="flex-1 h-px bg-gray-200 mx-6"></div>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === "OTP"
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Verify</p>
                    <p className="text-gray-500 text-sm">Enter OTP</p>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {serverError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center justify-center text-red-600 font-medium">
                    <span className="mr-2">⚠️</span>
                    {serverError}
                  </div>
                </div>
              )}

              {/* ================= LOGIN FORM ================= */}
              {step === "LOGIN" && (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                    <p className="text-gray-600 mb-6">Sign in to continue your reading journey</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <Mail size={20} className="text-gray-500" />
                      </div>
                      <input
                        type="email"
                        placeholder="reader@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <Lock size={20} className="text-gray-500" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-2"
                    >
                      <Key size={16} />
                      Forgot password?
                    </button>

                    <button
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-3 font-semibold"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ================= OTP FORM ================= */}
              {step === "OTP" && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Secure Verification</h2>
                    <p className="text-gray-600 mb-6">
                      Enter the OTP sent to <span className="font-semibold text-gray-900">{email}</span>
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl mb-6">
                      <Shield size={32} className="text-green-600" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      One-Time Password
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full px-6 py-4 text-center text-2xl tracking-widest bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 font-bold"
                        maxLength="6"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-200">
                    {/* Full-width Verify Button */}
                    <button
                      disabled={loading || otp.length !== 6 || timer === 0}
                      className={`
                        w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                        flex items-center justify-center gap-3 mb-8
                        ${loading || otp.length !== 6 || timer === 0
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
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                      {/* Left: Clock Details */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Clock size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {timer > 0 ? `Code expires in 00:${timer.toString().padStart(2, '0')}` : "Ready for new code"}
                          </p>
                          <p className="text-sm text-gray-600">Check spam folder if not received</p>
                        </div>
                      </div>

                      {/* Right: Resend Button / Countdown State */}
                      {timer > 0 ? (
                        <div className="px-6 py-3 bg-gray-100 rounded-xl">
                          <p className="text-gray-700 font-medium">
                            Resend in <span className="text-gray-900">{timer}s</span>
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
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

                    {/* Back to Login Anchor */}
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("LOGIN");
                          setOtp("");
                        }}
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Divider */}
              <div className="my-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    New to ReadWise?
                  </span>
                </div>
              </div>

              {/* Registration Link */}
              <div className="text-center">
                <Link
                  to="/email-register"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-900 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-gray-200 font-semibold"
                >
                  <UserPlus size={20} />
                  Create Your Reading Account
                </Link>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <Shield size={16} className="text-green-500" />
                <span className="text-sm text-gray-600">
                  256-bit SSL Encryption • Secure Authentication
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            Need help?{" "}
            <button
              type="button"
              className="text-gray-900 hover:text-blue-600 font-semibold hover:underline"
              onClick={() => navigate("/help")}
            >
              Contact Support
            </button>

            {" "}or call us at{" "}
            <span className="text-gray-900 font-semibold">1-800-READWISE</span>
          </p>
          <p className="text-xs text-gray-500 mt-4">
            © {new Date().getFullYear()} ReadWise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Eye, EyeOff, Mail, Phone, User, Lock, ArrowRight } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "reader", // default role
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post("/google-login/", {
        token: credentialResponse.credential,
      });
      login(res.data);
      navigate("/");
    } catch (err) {
      setServerError("Google login failed. Try again.");
    }
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone) => /^\d{10}$/.test(phone);

  const validateFields = () => {
    const newErrors = {};
    if (!isValidPhone(form.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }
    if (!isValidEmail(form.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const registerUser = async () => {
    if (!validateFields()) return;

    try {
      setLoading(true);
      const res = await api.post("/email-register/", {
        username: form.username,
        phone_number: form.phone,
        email: form.email,
        password: form.password,
        confirm_password: form.confirmPassword,
        role: form.role,
      });

      navigate("/email-otp-verify", {
        state: { registration_id: res.data.registration_id },
      });
    } catch (error) {
      const data = error.response?.data;
      if (typeof data === "string") {
        setServerError(data);
      } else if (data?.error) {
        setServerError(data.error);
      } else if (typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        setServerError(data[firstKey][0]);
      } else {
        setServerError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      <div className="w-full max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-10 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-black/5 rounded-2xl">
              <BookOpen size={32} className="text-gray-800" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Read<span className="text-blue-600">Wise</span>
            </h1>
          </div>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            Join our community of readers and unlock unlimited access to books, audiobooks, and exclusive content.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Left Column - Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-gray-200">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Create Account
              </h2>
              <p className="text-gray-600">
                Fill in your details to get started
              </p>
            </div>

            {/* Server Error Message */}
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-center font-medium">
                  {serverError}
                </p>
              </div>
            )}

            <div className="space-y-6">
              {/* Role Selection Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  I want to join as a
                </label>
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: "reader" })}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${form.role === "reader"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Reader
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: "author" })}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${form.role === "author"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Author
                  </button>
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <User size={20} className="text-gray-500" />
                  </div>
                  <input
                    name="username"
                    placeholder="Choose a username"
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Phone size={20} className="text-gray-500" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter 10-digit phone number"
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.phone}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Mail size={20} className="text-gray-500" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock size={20} className="text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a secure password"
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock size={20} className="text-gray-500" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Register Button */}
              <button
                onClick={registerUser}
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3
                  ${loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-black text-white hover:shadow-2xl hover:scale-[1.02]"
                  }`}
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Auth Button */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setServerError("Google login failed");
                  }}
                  theme="outline"
                  size="large"
                  text="signup_with"
                  shape="pill"
                />
              </div>

              {/* Terms */}
              <p className="text-center text-sm text-gray-600 pt-6">
                By registering, you agree to our{" "}
                <a href="#" className="text-gray-900 hover:text-blue-600 font-semibold hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-gray-900 hover:text-blue-600 font-semibold hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Right Column - Features & Login */}
          <div className="space-y-8">
            {/* Features Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Why Join ReadWise?
              </h3>
              <div className="space-y-6">
                {[
                  {
                    icon: "📚",
                    title: "Unlimited Access",
                    description: "Read millions of books, audiobooks, and magazines"
                  },
                  {
                    icon: "🎧",
                    title: "Offline Reading",
                    description: "Download and read anytime, anywhere"
                  },
                  {
                    icon: "⭐",
                    title: "Personalized Recommendations",
                    description: "Get book suggestions based on your interests"
                  },
                  {
                    icon: "👥",
                    title: "Join Community",
                    description: "Connect with fellow readers and authors"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-50 rounded-xl text-2xl">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Already have an account?</h3>
                  <p className="text-gray-300 text-sm">Sign in to continue your reading journey</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-4 px-6 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3"
              >
                Sign In Now
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
                <div className="text-3xl font-bold text-gray-900 mb-2">10M+</div>
                <div className="text-gray-600 text-sm">Active Readers</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
                <div className="text-3xl font-bold text-gray-900 mb-2">500K+</div>
                <div className="text-gray-600 text-sm">Books Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Need help?{" "}
            <button
              type="button"
              className="text-gray-900 font-semibold hover:text-blue-600 hover:underline"
              onClick={() => navigate("/help")}
            >
              Contact Support
            </button>
            {" "}or call us at{" "}
            <span className="text-gray-900 font-semibold">1-800-READWISE</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
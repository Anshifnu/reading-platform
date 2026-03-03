import { Routes, Route } from "react-router-dom";

import MainLayout from "./MainLayout";
import RoleRoute from "./RoleRoute";
import PublicRoute from "./PublicRoute";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/EmailRegister";
import OTPVerify from "../pages/EmailOtpVerify";
import ForgotPassword from "../pages/ForgotPassword";

import AdminDashboard from "../admin/AdminDashboard";
import PublisherDashboard from "../author/AuthorDashboard";
import Books from "../pages/Books";
import BookDetail from "../pages/BookDetail";
import BookReader from "../pages/BookReader";
import AuthorList from "../pages/AuthorList";
import AuthorFollowRequests from "../author/AuthorFollowRequests";
import ChatRoom from "../pages/ChatRoom";
import ChatList from "../pages/ChatList";
import CreateChatRoom from "../pages/CreateChatRoom";
import Profile from "../pages/profile";
import EditProfile from "../pages/EditProfile";
import Favorite from "../pages/Favorite";
import DailyUpdates from "../pages/DailyUpdates";

import Subscription from "../pages/Subscription";
import Notification from "../pages/Notifications";
import Coin from "../pages/Coins";
import WriteContent from "../author/WriteContent";
import PublishDetails from "../author/PublishDetails";
import SubmitBook from "../author/SubmitBook";
import AuthorWorkDetail from "../pages/AuthorWorkDetail";
import AdminBookVerification from "../admin/AdminBookVerification";
import AdminUserManagement from "../admin/AdminUserManagement";
import AdminBookManagement from "../admin/AdminBookManagement";
import AdminAnalytics from "../admin/AdminAnalytics";

const AppRouter = () => {
  return (
    <Routes>

      {/* ✅ Routes WITH Navbar */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/updates" element={<DailyUpdates />} />

        <Route path="/authors" element={<AuthorList />} />
        <Route path="/work/:id" element={<AuthorWorkDetail />} />
        <Route path="/readers-requests" element={<AuthorFollowRequests />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
        <Route path="/create/chat" element={<CreateChatRoom />} />
        {/* 🔐 Reader + Author only — admin cannot access profile pages */}
        <Route element={<RoleRoute allowedRoles={["reader", "author"]} />}>
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile/:authorId" element={<Profile />} />
        </Route>

        <Route path="/favorites" element={<Favorite />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/notifications" element={<Notification />} />
        <Route path="/coins" element={<Coin />} />









        {/* 🔐 Admin with Navbar */}
        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/books" element={<AdminBookManagement />} />
          <Route path="/book-verification" element={<AdminBookVerification />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>


        <Route element={<RoleRoute allowedRoles={["author"]} />}>
          <Route path="/publisher" element={<PublisherDashboard />} />
          <Route path="/write" element={<WriteContent />} />
          <Route path="/publish-details" element={<PublishDetails />} />
          <Route path="/submit-book" element={<SubmitBook />} />
        </Route>
      </Route>

      <Route path="/reader/:id" element={<BookReader />} />

      {/* ❌ Routes WITHOUT Navbar */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/email-register" element={<Register />} />
        <Route path="/email-otp-verify" element={<OTPVerify />} />
      </Route>

      <Route path="/forgot-password" element={<ForgotPassword />} />

    </Routes>
  );
};

export default AppRouter;

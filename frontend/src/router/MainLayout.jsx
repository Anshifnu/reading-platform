import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../pages/firebase";
import api from "../services/Api"; // your axios instance

import { useAuth } from "../context/AuthContext";

const MainLayout = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {

    const requestPermissionAndSaveToken = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          const currentToken = await getToken(messaging, {
            vapidKey: "BH2QduRncGaFEQ_x7pxGI0jP4zXKsvJMjz_nm_nxgSzuhGml3D9I0iXvIrTO8M0O3YOzJb1q8lekl9gMcZhAX8Q"
          });

          if (currentToken && currentToken.trim() !== "") {
            await api.post("/save-device-token/", {
              token: currentToken
            });
            console.log("Device token saved");
          } else {
            console.warn("Firebase returned empty token, skipping save");
          }
        }

      } catch (error) {
        console.error("Error getting token:", error);
        if (error.response) {
          console.error("Server response:", error.response.data);
        }
      }
    };

    if (isAuthenticated) {
      requestPermissionAndSaveToken();
    }
  }, [isAuthenticated]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default MainLayout;

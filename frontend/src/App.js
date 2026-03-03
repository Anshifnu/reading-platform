import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router/AppRouter";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

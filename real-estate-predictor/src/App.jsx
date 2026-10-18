import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Prediction from "./pages/Prediction";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Requirements from "./pages/Requirements";
import Assistant from "./pages/Assistant";
import {
  getCurrentUser,
  logoutUser,
  refreshSession,
} from "./services/api";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let mounted = true;

    for (const key of [
      "estateai_token",
      "estateai_user",
      "estateai-token",
      "estateai-user",
    ]) {
      localStorage.removeItem(key);
    }

    async function restoreSession() {
      try {
        let result;

        try {
          result = await getCurrentUser();
        } catch (error) {
          if (error.response?.status !== 401) {
            throw error;
          }
          result = await refreshSession();
        }

        if (mounted) {
          setUser(result.user);
        }
      } catch (error) {
        if (mounted) {
          if (error.response?.status === 401) {
            setUser(null);
          } else {
            const detail = error.response?.data?.detail;
            setSessionError(
              typeof detail === "string"
                ? detail
                : "Could not restore your session. Check that the API is running.",
            );
          }
        }
      } finally {
        if (mounted) {
          setSessionLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setSessionError("");
      return true;
    } catch (error) {
      const detail = error.response?.data?.detail;
      setSessionError(
        typeof detail === "string"
          ? detail
          : "Unable to sign out. Please try again.",
      );
      return false;
    }
  };

  return (
    <BrowserRouter>
      <div className="app">
        {/* ==================================================
            NAVBAR
        ================================================== */}
        <Navbar user={user} onLogout={handleLogout} />

        {sessionError && (
          <div className="session-error" role="alert">
            {sessionError}
          </div>
        )}

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}
        <main className="main-content">
          <Routes>
            {/* ==================================================
                PUBLIC ROUTES
            ================================================== */}

            <Route path="/" element={<Home />} />

            <Route path="/about" element={<About />} />

            <Route path="/contact" element={<Contact />} />

            <Route path="/requirements" element={<Requirements />} />

            <Route path="/assistant" element={<Assistant />} />

            {/* ==================================================
                AUTHENTICATION ROUTES
            ================================================== */}

            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/prediction" replace />
                ) : (
                  <Login onAuthenticated={setUser} />
                )
              }
            />

            <Route
              path="/signup"
              element={
                user ? (
                  <Navigate to="/prediction" replace />
                ) : (
                  <Signup onAuthenticated={setUser} />
                )
              }
            />

            {/* ==================================================
                APPLICATION ROUTES
            ================================================== */}

            <Route
              element={
                <ProtectedRoute user={user} loading={sessionLoading} />
              }
            >
              <Route path="/prediction" element={<Prediction />} />
            </Route>

            {/* ==================================================
                FALLBACK ROUTE
            ================================================== */}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

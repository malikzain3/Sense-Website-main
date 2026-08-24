import React, { useEffect, useState } from "react";
import "./LoginPage.css";
import senseLogo from "../assets/SENSE-LOGO@4x-8.png";
import toast from "react-hot-toast";
import { Mail, Lock } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if already logged in via JWT token and session time
    const token = localStorage.getItem("token");
    const loginTime = parseInt(localStorage.getItem("loginTime") || "0");
    const elapsed = Date.now() - loginTime;
    const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours

    if (token && loginTime && elapsed < SESSION_DURATION) {
      toast.success("You are already logged in! 🔒");
      window.location.href = "/Dashboard";
    }

    // Tilt animation logic
    if (window.$ && window.$.fn && window.$.fn.tilt) {
      window.$(".js-tilt").tilt({ scale: 1.1 });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Automatically picks local server for localhost, Railway for production
      // Local host handles port 5000 directly, production routes through Vercel rewrite
      const API_URL =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
          ? "http://localhost:5000"
          : "";
      const response = await fetch(
        "https://sense-website-main-production.up.railway.app/api/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Wrong Credentials!");
        return;
      }

      // Store JWT token and session timestamp
      localStorage.setItem("token", data.token);
      localStorage.setItem("loginTime", Date.now().toString());

      toast.success("Welcome Back, Admin! 👋");
      setTimeout(() => {
        window.location.href = "/Dashboard";
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Server error. Please check backend connection.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Left Side: Logo Area */}
        <div className="login-image-section js-tilt">
          <img src={senseLogo} alt="SENSE Logo" />
        </div>

        {/* Right Side: Form Area */}
        <form className="login-form" onSubmit={handleLogin}>
          <h2 className="login-title">Admin Login</h2>

          <div className="input-group">
            <span className="input-icon">
              <Mail size={18} />
            </span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            LOGIN
          </button>

          <div className="login-footer">
            <p className="restricted-text">Authorized Team Access Only</p>
            <span className="contact-text">Contact Admin for login issues</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

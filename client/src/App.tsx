import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import axios from "axios";

// Import Navigation directly to ensure it's always available
import Navigation from "./components/Navigation";

//buttons page to access all pages from 1 page
const Buttons = lazy(() => import("./pages/Dummy Buttons"));

// Lazy load other components
const HeroSection = lazy(() => import("./components/HeroSection"));
const FeaturesSection = lazy(() => import("./components/FeaturesSection"));
const FAQSection = lazy(() => import("./components/FAQSection"));
const CTASection = lazy(() => import("./components/Footer"));
const HowItWorks = lazy(() => import("./components/HowItWorks"));

// Auth components
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));
const AdminRegister = lazy(() => import("./pages/auth/AdminRegister"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const OTPVerification = lazy(() => import("./pages/auth/OTPVerification"));
const PageNotFound = lazy(() => import("./pages/auth/PageNotFound"));

// Role-based Dashboard components
const PatientDashboard = lazy(
  () => import("./pages/dashboard/PatientDashboard")
);
const PsychiatristDashboard = lazy(
  () => import("./pages/dashboard/PsychiatristDashboard")
);
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
//const AdminDashboard2 = lazy(() => import("./components/AdminDashboard"));

// Patient-specific pages
const InitialTestPage = lazy(() => import("./pages/patient/InitialTestPage"));
const LearningPlanPage = lazy(() => import("./pages/patient/LearningPlanPage"));
const ReportsPage = lazy(() => import("./pages/patient/ReportsPage"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Landing page layout
const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Suspense fallback={<LoadingSpinner />}>
        <main>
          <div id="home">
            <HeroSection />
          </div>
          <div id="about">
            <FeaturesSection />
          </div>
          <div id="services">
            <HowItWorks />
          </div>
          <div id="faq">
            <FAQSection />
          </div>
          <div id="contact">
            <CTASection />
          </div>
        </main>
      </Suspense>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>

          <Suspense fallback={<LoadingSpinner />}>
            <div className="min-h-screen">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/register" element={<AdminRegister />} />
                <Route path="/verify-otp" element={<OTPVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* //all old pages */}

                <Route path="/buttons" element={<Buttons />} />

                {/* Role-based Dashboard routes - These are new dashboards ✅*/}
                <Route
                  path="/patient/dashboard"
                  element={<PatientDashboard />}
                />
                <Route
                  path="/psychiatrist/dashboard"
                  element={<PsychiatristDashboard />}
                />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                {/* <Route path="/admin/dashboard2" element={<AdminDashboard2 />} /> */}

                {/* Patient-specific routes */}
                <Route
                  path="/patient/initial-test"
                  element={<InitialTestPage />}
                />
                <Route
                  path="/patient/learning-plan"
                  element={<LearningPlanPage />}
                />
                <Route path="/patient/reports" element={<ReportsPage />} />

                {/* Default dashboard route - redirects to appropriate dashboard based on role */}
                <Route path="/dashboard" element={<PatientDashboard />} />

                {/* Catch-all route for 404 */}
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </div>
          </Suspense>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;

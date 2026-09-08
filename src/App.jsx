import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { ServiceProvider } from "./context/ServiceContext";
import { BlockedCustomerProvider } from "./context/BlockedCustomerContext";
import { AppointmentProvider } from "./context/AppointmentContext";
import { AuditLogProvider } from "./context/AuditLogContext";
import { NotificationProvider } from "./context/NotificationContext";

import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

import { Home } from "./components/pages/Home";
import { Services } from "./components/pages/Services";
import { BookAppointment } from "./components/pages/BookAppointment";
import { MyAppointments } from "./components/pages/MyAppointments";
import { AdminPanel } from "./components/pages/AdminPanel";
import { Login } from "./components/pages/Login";
import { NotFound } from "./components/pages/NotFound";
import { StaffPanel } from "./components/pages/StaffPanel";

import "./App.css";
import { ClosedDayProvider } from "./context/ClosedDayContext";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuditLogProvider>
          <NotificationProvider>
            <AuthProvider>
              <ServiceProvider>
                <BlockedCustomerProvider>
                  <ClosedDayProvider>
                    <AppointmentProvider>
                      <BrowserRouter>
                        <div className="app-shell">
                          <Header />
                          <main className="app-main">
                            <Routes>
                              <Route path="/" element={<Home />} />
                              <Route path="/hizmetler" element={<Services />} />
                              <Route path="/randevu-al" element={<BookAppointment />} />
                              <Route path="/randevularim" element={<MyAppointments />} />
                              <Route path="/giris" element={<Login />} />
                              <Route
                                path="/staff"
                                element={
                                  <ProtectedRoute allowedRoles={["staff"]}>
                                    <StaffPanel />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/admin"
                                element={
                                  <ProtectedRoute allowedRoles={["admin"]}>
                                    <AdminPanel />
                                  </ProtectedRoute>
                                }
                              />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </main>
                          <Footer />
                        </div>
                        <ToastContainer position="top-center" autoClose={3500} theme="dark" />
                      </BrowserRouter>
                    </AppointmentProvider>
                  </ClosedDayProvider>
                </BlockedCustomerProvider>
              </ServiceProvider>
            </AuthProvider>
          </NotificationProvider>
        </AuditLogProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;

import { Routes, Route, useLocation } from "react-router-dom";
import GoogleLoginSuccess from "./pages/GoogleLoginSuccess";
import SouvenirDetailPage from "./pages/SouvenirDetailPage.jsx";
import staffRoutes from "./routes/staffRoutes";
import Header from "./components/layout/ClustomerHeader.jsx";
import Toast from "./components/common/Toast.jsx";
import Footer from "./components/layout/Footer.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import BooksPage from "./pages/BooksPage.jsx";
import BookDetailPage from "./pages/BookDetailPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import StationeryPage from "./pages/StationeryPage.jsx";
import StationeryDetailPage from "./pages/StationeryDetailPage.jsx";
import ToysDetailPage from "./pages/ToysDetailPage.jsx";
import SchoolSupplyDetailPage from "./pages/SchoolSupplyDetailPage.jsx";
import SchoolSuppliesPage from "./pages/SchoolSuppliesPage.jsx";
import ToysPage from "./pages/ToysPage.jsx";
import SouvenirsPage from "./pages/SouvenirsPage.jsx";
import AccessoriesPage from "./pages/AccessoriesPage.jsx";
import AccessoryDetailPage from "./pages/AccessoryDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import SupportPage from "./pages/SupportPage.jsx";
import HirePage from "./pages/HirePage";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminStationeryPage from "./components/admin/AdminStationeryPage.jsx";
import AdminToys from "./components/admin/AdminToysPage.jsx";
import AdminSchoolSuppliesPage from "./components/admin/AdminSchoolSuppliesPage.jsx";
import AdminAccessoriesPage from "./components/admin/AdminAccessoriesPage.jsx";
import AdminSouvenirsPage from "./components/admin/AdminSouvenirsPage.jsx";
import AdminAuthorsPage from "./components/admin/AdminAuthorsPage.jsx";
import AdminPublishersPage from "./components/admin/AdminPublishersPage.jsx";
import AdminMessages from "./components/admin/AdminMessages.jsx";
import AdminBrands from "./components/admin/AdminBrands";
import AdminManufacturers from "./components/admin/AdminManufacturers.jsx";
import AdminInventory from "./components/admin/AdminInventory.jsx";
import AdminRecruitmentsPage from "./components/admin/AdminRecruitmentsPage.jsx";
function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const isStaffPath = location.pathname.startsWith("/staff");
  const isDashboardPath = isAdminPath || isStaffPath;
  return (
    <>
      {!isDashboardPath && <Header />}
      <Toast />
      <main className={!isDashboardPath ? "main-content" : ""}>
        <Routes>
          {staffRoutes}
          {/* Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/stationery" element={<StationeryPage />} />
          <Route path="/stationery/:id" element={<StationeryDetailPage />} />
          <Route path="/toys" element={<ToysPage />} />
          <Route path="/toys/:id" element={<ToysDetailPage />} />
          <Route path="/souvenirs" element={<SouvenirsPage />} />
          <Route path="/souvenirs/:id" element={<SouvenirDetailPage />} />
          <Route path="/school-supplies" element={<SchoolSuppliesPage />} />
          <Route path="/school-supplies/:id" element={<SchoolSupplyDetailPage />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/accessories/:id" element={<AccessoryDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/auth/google-success" element={<GoogleLoginSuccess />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={[1, 2]}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={[1, 2]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/hire" element={<HirePage />} />
          {/* Admin pages */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <AdminLayout>
                  <Routes>
                    <Route index element={<DashboardPage />} />
                    <Route path="orders" element={<DashboardPage />} />
                    <Route path="books" element={<DashboardPage />} />
                    <Route path="stationery" element={<AdminStationeryPage />} />
                    <Route path="toys" element={<AdminToys />} />
                    <Route path="school" element={<AdminSchoolSuppliesPage />} />
                    <Route path="accessories" element={<AdminAccessoriesPage />} />
                    <Route path="souvenirs" element={<AdminSouvenirsPage />} />
                    <Route path="authors" element={<AdminAuthorsPage />} />
                    <Route path="publishers" element={<AdminPublishersPage />} />
                    <Route path="brands" element={<AdminBrands />} />
                    <Route path="messages" element={<AdminMessages />} />
                    <Route path="manufacturers" element={<AdminManufacturers />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="recruitments" element={<AdminRecruitmentsPage />} />

                    <Route path="categories" element={<DashboardPage />} />
                    <Route path="customers" element={<DashboardPage />} />
                    <Route path="promotions" element={<DashboardPage />} />
                    <Route path="shipping" element={<DashboardPage />} />
                    <Route path="reviews" element={<DashboardPage />} />
                    <Route path="reports" element={<DashboardPage />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isDashboardPath && <Footer />}
    </>
  );
}
export default App;
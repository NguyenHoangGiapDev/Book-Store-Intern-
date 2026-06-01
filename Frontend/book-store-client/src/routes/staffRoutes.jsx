import { Navigate, Route } from "react-router-dom";
import StaffProtectedRoute from "../components/staff/StaffProtectedRoute";
import StaffLayout from "../pages/staff/StaffLayout";
import StaffPOS from "../pages/staff/StaffPOS";
import StaffOrders from "../pages/staff/StaffOrders";
import StaffProducts from "../pages/staff/StaffProducts";
import StaffCustomers from "../pages/staff/StaffCustomers";
import StaffReturns from "../pages/staff/StaffReturns";
import StaffShift from "../pages/staff/StaffShift";
import StaffReports from "../pages/staff/StaffReports";
import StaffProfile from "../pages/staff/StaffProfile";
import StaffPromotions from "../pages/staff/StaffPromotions";
import StaffLoyalty from "../pages/staff/StaffLoyalty";
const staffRoutes = (
  <Route element={<StaffProtectedRoute />}>
    <Route path="/staff" element={<StaffLayout />}>
      <Route index element={<Navigate to="/staff/pos" replace />} />
      <Route path="pos" element={<StaffPOS />} />
      <Route path="orders" element={<StaffOrders />} />
      <Route path="products" element={<StaffProducts />} />
      <Route path="customers" element={<StaffCustomers />} />
      <Route path="returns" element={<StaffReturns />} />
      <Route path="shift" element={<StaffShift />} />
      <Route path="reports" element={<StaffReports />} />
      <Route path="profile" element={<StaffProfile />} />
      <Route path="promotions" element={<StaffPromotions />} />
      <Route path="loyalty" element={<StaffLoyalty />} />
    </Route>
  </Route>
);
export default staffRoutes;
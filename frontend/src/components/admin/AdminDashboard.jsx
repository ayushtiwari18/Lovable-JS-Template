import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardOverview } from "./DashboardOverview";
import { ProductsPage } from "./pages/ProductsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { OrdersPage } from "./pages/OrdersPage";
import { CustomersPage } from "./pages/CustomersPage";
import { ReportsPage } from "./pages/ReportsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { UsersPage } from "./pages/UsersPage";
import { MessagesPage } from "./pages/MessagesPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { MediaPage } from "./pages/MediaPage";
import AddProductPage from "./pages/AddProductPage";
import { cn } from "@/lib/utils";

export function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  return (
    <div className={cn("min-h-screen bg-background", darkMode && "dark")}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />

          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />

            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-light">
              <div className="container mx-auto px-6 py-8">
                <Routes>
                  <Route path="/" element={<DashboardOverview />} />
                  <Route path="/dashboard" element={<DashboardOverview />} />
                  <Route
                    path="/products/add-product"
                    element={<AddProductPage />}
                  />
                  <Route path="/products/*" element={<ProductsPage />} />
                  <Route path="/categories/*" element={<CategoriesPage />} />
                  <Route path="/orders/*" element={<OrdersPage />} />
                  <Route path="/customers/*" element={<CustomersPage />} />
                  <Route path="/reports/*" element={<ReportsPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/users/*" element={<UsersPage />} />
                  <Route path="/messages/*" element={<MessagesPage />} />
                  <Route path="/payments/*" element={<PaymentsPage />} />
                  <Route path="/media" element={<MediaPage />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

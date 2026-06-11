import { Route, Routes } from "react-router-dom";
import {
  BusinessessRoutes,
  ClientsRoutes,
  CategoriesRoutes,
  ProductsRoutes,
  DepositsRoutes,
  StockRoutes,
  SalesRoutes,
} from "@/views/admin/module";
import { SideBar } from "@/components";
import { useState } from "react";

export const AdminRoutes = () => {
  const [isOpenSideBar, setIsOpenSideBar] = useState<boolean>(false);
  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <SideBar
        isOpenSideBar={isOpenSideBar}
        setIsOpenSideBar={setIsOpenSideBar}
      />

      {/* Overlay (solo visible si el sidebar está abierto en mobile/tablet) */}
      {isOpenSideBar && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 xl:hidden"
          onClick={() => setIsOpenSideBar(false)}
        ></div>
      )}

      {/* Main content */}
      <main className="xl:ml-72 min-h-screen overflow-y-auto p-4">
        {/* 🔹 Botón de menú fijo arriba del contenido */}
        <button
          onClick={() => setIsOpenSideBar(true)}
          className="inline-flex items-center p-2 mb-4 text-sm text-gray-500 rounded-lg xl:hidden hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <svg
            className="w-6 h-6"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              clipRule="evenodd"
              fillRule="evenodd"
              d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
            />
          </svg>
        </button>

        <Routes>
          <Route path="/clients/*" element={<ClientsRoutes />} />
          <Route path="/categories-product/*" element={<CategoriesRoutes />} />
          <Route path="/products/*" element={<ProductsRoutes />} />
          <Route path="/deposits/*" element={<DepositsRoutes />} />
          <Route path="/stock/*" element={<StockRoutes />} />
          <Route path="/sales/*" element={<SalesRoutes />} />
          <Route path="/businesses/*" element={<BusinessessRoutes />} />
          {/* <Route path="/account/*" element={<AccountRoutes />} />
          <Route path="/category-transaction/*" element={<CategoryRoutes />} />
          <Route path="/transactions/*" element={<TransactionsRoutes />} />
          <Route path="/loans/*" element={<LoansRoutes />} />
          <Route path="/employees/*" element={<EmployeesRoutes />} /> */}
        </Routes>
      </main>
    </div>
  );
};

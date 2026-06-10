import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { sidebarLinkClass } from "../helpers";
import { useAuthStore } from "@/views/admin";
import { LiGeneral } from "./sidebar-components";
import { productNav, peopleNav,stockNav, saleNav } from "@/navigation";

type SideBarProps = {
  isOpenSideBar: boolean;
  setIsOpenSideBar: (open: boolean) => void;
};

export const SideBar = ({ isOpenSideBar, setIsOpenSideBar }: SideBarProps) => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [openProducts, setOpenProducts] = useState(false);
  const [openPeople, setOpenPeople] = useState(false);
  const [openStock, setOpenStock] = useState(false);
  const [openSales, setOpenSales] = useState(false);
  const siderBarRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isProfileActive = location.pathname.startsWith("/admin/profile");

  const handleGoProfile = () => {
    navigate("/admin/profile");
    setIsOpenSideBar(false);
  };

  const displayName = (() => {
    const fullName = [user?.username].filter(Boolean).join(" ");
    if (fullName) return fullName;
    if (user?.username) return user.username;
    return "Mi perfil";
  })();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (siderBarRef.current && !siderBarRef.current.contains(target)) {
        setIsOpenSideBar(false);
      }
    };

    if (isOpenSideBar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenSideBar, setIsOpenSideBar]);

  return (
    <>
      {isOpenSideBar && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 xl:hidden"
          onClick={() => setIsOpenSideBar(false)}
        />
      )}

      <aside
        ref={siderBarRef}
        id="sidebar"
        aria-label="Sidebar"
        className={`fixed top-0 left-0 z-40 h-[100dvh] w-72 bg-gray-50 dark:bg-gray-800 
           transition-transform duration-300 ease-in-out
           ${isOpenSideBar ? "translate-x-0" : "-translate-x-full"}
           xl:translate-x-0`}
      >
        <div className="flex flex-col h-full px-3 py-4 bg-gray-100 dark:bg-gray-800">
          <ul className="space-y-2 font-medium flex-1 overflow-y-auto">
            <li>
              <Link
                to="/admin/dasbhoard"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-200"
                onClick={() => setIsOpenSideBar(false)}
              >
                <span className="ms-3">Home</span>
              </Link>
            </li>

            <LiGeneral
              key={1}
              isOpen={openPeople}
              setIsOpen={setOpenPeople}
              links={peopleNav}
              sidebarLinkClass={sidebarLinkClass}
              location={location}
              title="Personas"
            />
            <LiGeneral
              key={2}
              isOpen={openProducts}
              setIsOpen={setOpenProducts}
              links={productNav}
              sidebarLinkClass={sidebarLinkClass}
              location={location}
              title="Productos"
            />
            <LiGeneral
              key={3}
              isOpen={openStock}
              setIsOpen={setOpenStock}
              links={stockNav}
              sidebarLinkClass={sidebarLinkClass}
              location={location}
              title="Stock"
            />
            <LiGeneral
              key={4}
              isOpen={openSales}
              setIsOpen={setOpenSales}
              links={saleNav}
              sidebarLinkClass={sidebarLinkClass}
              location={location}
              title="Ventas"
            />
          </ul>

          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div
              className={`flex items-center justify-between w-full rounded-lg px-2 py-2 transition
                ${
                  isProfileActive
                    ? "bg-blue-100 text-blue-700 dark:bg-gray-700"
                    : "text-gray-900 dark:text-white"
                }`}
            >
              <button
                onClick={handleGoProfile}
                className="flex items-center flex-1 rounded-lg px-1 py-1 hover:bg-gray-200/80 dark:hover:bg-gray-700/80"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-gray-600 flex items-center justify-center mr-3" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold truncate max-w-[150px]">
                    {displayName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Ver perfil
                  </span>
                </div>
              </button>

              <button
                title="Cerrar sesión"
                className="ml-2 px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex flex-col items-center gap-1"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                <span className="text-[10px] leading-none text-gray-500">
                  Cerrar sesión
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

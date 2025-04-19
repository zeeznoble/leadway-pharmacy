import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import Brand from "../brand";
import Drawer from "./drawer";

import {
  DashboardIcon,
  DeliveriesIcon,
  EnrolleeIcon,
  HelpIcon,
  PharmacyIcon,
  ReportsIcon,
  StockIcon,
  TasksIcon,
} from "../icons/main-icons";

export default function SideNav() {
  const router = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    const handleToggleDrawer = () => {
      setIsDrawerOpen((prev) => !prev);
    };

    window.addEventListener("toggleDrawer", handleToggleDrawer);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
      window.removeEventListener("toggleDrawer", handleToggleDrawer);
    };
  }, []);

  const navItems = [
    {
      link: "/",
      icon: (
        <DashboardIcon
          strokeWidth={router.pathname === "/" ? "1.5" : "1"}
          stroke={router.pathname === "/" ? "#ffffff" : "#475467"}
          width={23}
          height={20}
          className="hover-icon"
        />
      ),
      text: "Dashboard",
    },
    {
      link: "/enrollee",
      icon: (
        <EnrolleeIcon
          strokeWidth={router.pathname.startsWith("/enrollee") ? "1.5" : "1"}
          stroke={
            router.pathname.startsWith("/enrollee") ? "#ffffff" : "#475467"
          }
          width={23}
          height={20}
          className="hover-icon"
        />
      ),
      text: "Enrollee",
    },
    {
      link: "/tasks",
      icon: (
        <TasksIcon
          strokeWidth={router.pathname.startsWith("/tasks") ? "1.5" : "1"}
          stroke={router.pathname.startsWith("/tasks") ? "#ffffff" : "#475467"}
          width={23}
          height={20}
          className="hover-icon"
        />
      ),
      text: "My Tasks",
    },
    {
      link: "/deliveries",
      icon: (
        <DeliveriesIcon
          strokeWidth={router.pathname.startsWith("/deliveries") ? "1.5" : "1"}
          stroke={
            router.pathname.startsWith("/deliveries") ? "#ffffff" : "#475467"
          }
          width={23}
          height={20}
          className="hover-icon"
        />
      ),
      text: "Deliveries",
    },
    {
      link: "/pharmacy",
      icon: (
        <PharmacyIcon
          strokeWidth={router.pathname.startsWith("/pharmacy") ? "1.5" : "1"}
          stroke={
            router.pathname.startsWith("/pharmacy") ? "#ffffff" : "#475467"
          }
          width={23}
          height={20}
          className="hover-icon"
        />
      ),
      text: "Pharmacy",
    },
    {
      link: "/stock",
      icon: (
        <StockIcon
          strokeWidth={router.pathname.startsWith("/stock") ? "1.5" : "1"}
          stroke={router.pathname.startsWith("/stock") ? "#ffffff" : "#475467"}
          width={23}
          height={20}
          className="hover-icon"
        />
      ),
      text: "Stock",
    },
    {
      link: "/reports",
      icon: (
        <ReportsIcon
          strokeWidth={router.pathname.startsWith("/reports") ? "1.5" : "1"}
          stroke={
            router.pathname.startsWith("/reports") ? "#ffffff" : "#475467"
          }
          width={23}
          height={20}
          className="hover-icon"
        />
      ),
      text: "Reports",
    },
  ];

  const renderNavItems = () => (
    <div className="flex flex-col py-6 h-[100vh] bg-white">
      <div className="mb-6">
        <Brand />
      </div>
      <nav className="flex-1">
        <ul className="space-y-1 px-2">
          {navItems.map((item, index) => {
            const isActive =
              router.pathname === item.link ||
              (item.link !== "/" && router.pathname.startsWith(item.link));

            return (
              <li key={index}>
                <Link
                  to={item.link}
                  onClick={() => isMobile && setIsDrawerOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors duration-200 ${
                    isActive
                      ? "bg-[#c61531] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-4 mt-auto pb-6">
        <button className="flex items-center px-4 py-3 w-full text-sm text-gray-700 hover:bg-gray-200 rounded-lg">
          <HelpIcon stroke="#475467" className="h-6 w-6 mr-3" />
          <span>Help & Support</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden sm:block h-full w-[261px] border-r border-gray-200">
        {renderNavItems()}
      </div>

      {/* Mobile drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        {renderNavItems()}
      </Drawer>
    </>
  );
}

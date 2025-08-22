import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import Brand from "../brand";
import Drawer from "./drawer";

import {
  DashboardIcon,
  DeliveriesIcon,
  EnrolleeIcon,
  HelpIcon,
  PendingProvidersIcon,
  PharmacyIcon,
  RiderIcon,
  SentForDeliveryIcon,
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
        />
      ),
      text: "Dashboard",
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
        />
      ),
      text: "Pharmacy",
    },
    {
      link: "/enrollees",
      icon: (
        <EnrolleeIcon
          strokeWidth={router.pathname.startsWith("/enrollees") ? "1.5" : "1"}
          stroke={
            router.pathname.startsWith("/enrollee") ? "#ffffff" : "#475467"
          }
          width={23}
          height={20}
        />
      ),
      text: "Enrollees",
    },
    {
      link: "/create-delivery",
      icon: (
        <DeliveriesIcon
          strokeWidth={
            router.pathname.startsWith("/create-delivery") ? "1.5" : "1"
          }
          stroke={
            router.pathname.startsWith("/create-delivery")
              ? "#ffffff"
              : "#475467"
          }
          width={23}
          height={20}
        />
      ),
      text: "Create Deliveries",
    },
    {
      link: "/provider-pendings",
      icon: (
        <PendingProvidersIcon
          strokeWidth={
            router.pathname.startsWith("/provider-pendings") ? "1.5" : "1"
          }
          stroke={
            router.pathname.startsWith("/provider-pendings")
              ? "#ffffff"
              : "#475467"
          }
          width={23}
          height={20}
        />
      ),
      text: "Pending Approval",
    },
    {
      link: "/pack",
      icon: (
        <StockIcon
          strokeWidth={router.pathname.startsWith("/pack") ? "1.5" : "1"}
          stroke={router.pathname.startsWith("/pack") ? "#ffffff" : "#475467"}
          width={23}
          height={20}
        />
      ),
      text: "Pack",
    },
    {
      link: "/to-be-delivered",
      icon: (
        <TasksIcon
          strokeWidth={
            router.pathname.startsWith("/to-be-delivered") ? "1.5" : "1"
          }
          stroke={
            router.pathname.startsWith("/to-be-delivered")
              ? "#ffffff"
              : "#475467"
          }
          width={23}
          height={20}
        />
      ),
      text: "Assign To Rider",
    },
    {
      link: "/sent-for-delivery",
      icon: (
        <SentForDeliveryIcon
          strokeWidth={
            router.pathname.startsWith("/sent-for-delivery") ? "1.5" : "1"
          }
          stroke={
            router.pathname.startsWith("/sent-for-delivery")
              ? "#ffffff"
              : "#475467"
          }
          width={23}
          height={20}
        />
      ),
      text: "Sent For Delivery",
    },
    {
      link: "/rider",
      icon: (
        <RiderIcon
          strokeWidth={router.pathname.startsWith("/rider") ? "1.5" : "1"}
          stroke={router.pathname.startsWith("/rider") ? "#ffffff" : "#475467"}
          width={23}
          height={20}
        />
      ),
      text: "Create Rider",
    },
  ];

  const renderNavItems = () => (
    <div className="flex flex-col py-6 h-screen bg-white">
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

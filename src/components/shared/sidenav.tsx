import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import Brand from "../brand";
import Drawer from "./drawer";

import {
  AssignRiderIcon,
  DashboardIcon,
  DeliveriesIcon,
  EnrolleeIcon,
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
      icon: <DashboardIcon />,
      text: "Dashboard",
    },
    {
      link: "/pharmacy",
      icon: <PharmacyIcon />,
      text: "Pharmacy",
    },
    {
      link: "/enrollees",
      icon: <EnrolleeIcon />,
      text: "Enrollees",
    },
    {
      link: "/create-delivery",
      icon: <DeliveriesIcon />,
      text: "Create Deliveries",
    },
    {
      link: "/provider-pendings",
      icon: <PendingProvidersIcon />,
      text: "Pending Approval",
    },
    {
      link: "/third-party-assign",
      icon: <TasksIcon />,
      text: "Third Party Assign Rider",
    },
    {
      link: "/pack",
      icon: <StockIcon />,
      text: "Pack",
    },
    {
      link: "/to-be-delivered",
      icon: <AssignRiderIcon />,
      text: "Assign To Rider",
    },
    {
      link: "/sent-for-delivery",
      icon: <SentForDeliveryIcon />,
      text: "Sent For Delivery",
    },
    {
      link: "/rider",
      icon: <RiderIcon />,
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
                  <span className="mt-1">{item.text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* <div className="px-4 mt-auto pb-6">
        <button className="flex items-center px-4 py-3 w-full text-sm text-gray-700 hover:bg-gray-200 rounded-lg">
          <HelpIcon stroke="#475467" className="h-6 w-6 mr-3" />
          <span>Help & Support</span>
        </button>
      </div> */}
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

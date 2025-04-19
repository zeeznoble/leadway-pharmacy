import { useLocation } from "react-router-dom";

import { Avatar } from "@heroui/avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

import { ToggleIcon } from "../icons/main-icons";

export default function Header() {
  const router = useLocation();

  const getPageTitle = () => {
    const path = router.pathname;
    if (path === "/") return "Dashboard";
    if (path === "/enrollee") return "Enrollee";
    return path.substring(1).charAt(0).toUpperCase() + path.substring(2);
  };

  const toggleDrawer = () => {
    const event = new CustomEvent("toggleDrawer");
    window.dispatchEvent(event);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 px-4 sm:px-6 flex items-center justify-between w-full">
      <button
        className="block sm:hidden rounded p-2 focus:outline-none"
        onClick={toggleDrawer}
      >
        <ToggleIcon />
      </button>

      <div className="text-lg font-semibold text-gray-800">
        {getPageTitle()}
      </div>

      <div className="flex items-center space-x-4">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              size="sm"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">admin@example.com</p>
            </DropdownItem>
            <DropdownItem key="settings">My Settings</DropdownItem>
            <DropdownItem key="logout" color="danger">
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  );
}

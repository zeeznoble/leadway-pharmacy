import { PropsWithChildren } from "react";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Drawer({
  isOpen,
  onClose,
  children,
}: DrawerProps & PropsWithChildren) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {children}
      </div>
    </>
  );
}

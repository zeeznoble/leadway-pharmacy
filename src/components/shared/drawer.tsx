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
  if (typeof document === "undefined") return null;

  return (
    <>
     {isOpen && (
        <div
          className="fixed inset-0 bg-black/50"
          onClick={onClose}
          style={{
            position: "fixed",
            zIndex: 9998,
          }}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out`}
        style={{
          position: "fixed",
          zIndex: 9999,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {children}
      </div>
    </>
  );
}

import Header from "@/components/shared/header";
import SideNav from "@/components/shared/sidenav";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Fixed SideNav for desktop */}
      <div className="hidden sm:block sm:w-[261px] overflow-hidden h-screen">
        <SideNav />
      </div>

      {/* Scrollable main content */}
      <main className="flex flex-col flex-1 overflow-auto relative">
        <Header />
        <div className="p-4 sm:p-7 bg-[#FCFCFA] min-h-0 flex-1">{children}</div>
      </main>

      {/* Mobile SideNav controller */}
      <div className="sm:hidden">
        <SideNav />
      </div>
    </div>
  );
}

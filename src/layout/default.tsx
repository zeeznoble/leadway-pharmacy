import Header from "@/components/shared/header";
import SideNav from "@/components/shared/sidenav";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div className="hidden sm:block sm:w-[261px] min-h-screen">
          <SideNav />
        </div>
        <main className="grid w-full h-full">
          <Header />
          <div className="p-4 sm:p-10 bg-[#FCFCFA] h-full">{children}</div>
        </main>
      </div>

      {/* Mobile SideNav controller */}
      <div className="sm:hidden">
        <SideNav />
      </div>
    </>
  );
}

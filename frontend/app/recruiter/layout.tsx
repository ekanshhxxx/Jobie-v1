import Sidebar from "../../components/Sidebar";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">

      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 p-10">

        {children}

      </div>

    </div>
  );
}
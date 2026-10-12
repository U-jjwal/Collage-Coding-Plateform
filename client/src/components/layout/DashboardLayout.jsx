import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Shared dashboard layout with sidebar + top navbar.
 * All admin/teacher/student pages render inside this.
 */
const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <Navbar />
      {/* Main content — offset by sidebar width and header height */}
      <main className="ml-[260px] pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

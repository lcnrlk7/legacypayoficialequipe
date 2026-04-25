import { AuthProvider } from "@/components/auth-provider";
import { DashboardLayoutWrapper } from "@/components/dashboard/dashboard-layout-wrapper";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ServiceWorkerRegister />
      <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
    </AuthProvider>
  );
}

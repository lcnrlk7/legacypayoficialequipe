export default function KYCLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Este layout permite que a página de KYC seja acessível
  // mesmo quando o bloqueador está ativo no layout pai
  return (
    <div className="relative z-[60]">
      {children}
    </div>
  );
}

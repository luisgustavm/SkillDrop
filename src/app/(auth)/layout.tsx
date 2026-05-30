export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-40 border-b bg-card/50" aria-hidden="true" />
      <div className="relative z-10 w-full">{children}</div>
    </main>
  );
}

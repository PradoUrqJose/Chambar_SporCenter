import { Wallet } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-white p-4 dark:to-background">
      <div className="flex w-full max-w-4xl min-h-[560px] flex-col overflow-hidden rounded-2xl bg-card shadow-xl md:flex-row">
        <div className="flex flex-1 flex-col justify-center p-8 sm:p-12">
          <p className="mb-8 font-heading text-2xl font-bold tracking-tight text-tinta">
            Chambar
          </p>
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <div className="hidden flex-1 flex-col items-center justify-center gap-6 bg-muted p-12 text-center md:flex">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/20">
            <Wallet className="size-8 text-tinta" />
          </div>
          <div>
            <h2 className="mb-2 font-heading text-xl font-semibold">
              Gestión financiera centralizada
            </h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Controla el flujo de caja de cada empresa y cada stand desde un
              solo lugar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Un template (a diferencia de layout) se remonta en cada navegación, así que
// esta animación de entrada se dispara solo al cambiar de página — el
// BottomNav (en layout.tsx) no se ve afectado.
export default function PwaTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none">
      {children}
    </div>
  );
}

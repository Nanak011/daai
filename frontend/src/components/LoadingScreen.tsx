export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
      <div className="text-center">
        <img 
          src="/loader.gif" 
          alt="Loading..." 
          className="mx-auto w-64 h-64"
        />
      </div>
    </div>
  );
}

export default function LoadingScreen({ label = "Loading CrossPay..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6">
      <div className="surface-card max-w-sm space-y-4 p-8 text-center">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
        <div>
          <p className="text-sm font-semibold text-slate-500">Global Bridge</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink">{label}</h1>
        </div>
      </div>
    </div>
  );
}

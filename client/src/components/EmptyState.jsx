export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-bloom">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-400">
          0
        </div>
        <h3 className="mt-5 text-2xl font-bold text-ink">{title}</h3>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}

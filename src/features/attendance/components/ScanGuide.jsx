export default function ScanGuide({ offline = false }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-6 grid place-items-center"
      style={{ containerType: "size" }}>
      <div
        className={`relative aspect-square rounded-xl border-2 ${offline ? "border-amber-400" : "border-blue-400"}`}
        style={{ width: "min(220px, 100cqw, 100cqh)" }}>
        <span
          className={`absolute inset-x-3 top-1/2 h-0.5 animate-pulse motion-reduce:animate-none ${offline ? "bg-amber-400" : "bg-blue-400"}`}
        />
      </div>
    </div>
  );
}

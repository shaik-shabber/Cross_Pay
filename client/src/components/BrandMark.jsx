const sizeClasses = {
  sm: "h-11 w-11 rounded-2xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-16 w-16 rounded-[1.4rem]",
};

export default function BrandMark({ size = "md", className = "" }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white shadow-soft ${sizeClasses[size]} ${className}`}
    >
      <svg
        aria-hidden="true"
        className={size === "lg" ? "h-8 w-8" : "h-6 w-6"}
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M4 11.5 19.5 4l-5.8 16-3.3-5.2L4 11.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="m19.5 4-9.1 10.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

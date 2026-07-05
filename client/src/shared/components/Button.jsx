// Primary = pink accent CTA with white text (large/bold only, per design rules); dark text never on pink small copy.
export default function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full rounded-lg bg-accent px-4 py-2.5 font-heading font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

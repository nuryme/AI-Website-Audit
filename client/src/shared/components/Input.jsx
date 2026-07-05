import { forwardRef } from 'react';

// Labeled text input with inline error. Ref-forwarded so React Hook Form's register() works directly.
const Input = forwardRef(function Input({ label, error, id, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="font-heading text-sm font-medium">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        className="rounded-lg border border-secondary/40 bg-white px-3 py-2 text-[#1a1a1a] outline-none placeholder:text-secondary focus:border-accent focus:ring-1 focus:ring-accent dark:border-secondary/30 dark:bg-white/5 dark:text-[#f5f5f5]"
        {...props}
      />
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  );
});

export default Input;

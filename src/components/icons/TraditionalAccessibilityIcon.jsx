import React from 'react';

/**
 * Traditional International Symbol of Access (ISA)
 * Universal wheelchair accessibility figure conforming to ISO 7001 & ADA standards.
 */
export default function TraditionalAccessibilityIcon({ className = 'w-4 h-4', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="4" r="2" />
      <path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.24-.11-.49-.17-.76-.17-.28 0-.55.06-.8.18-.24.11-.46.28-.63.48L8.24 10.8c-.37.43-.64.95-.64 1.5 0 .88.58 1.63 1.4 1.88l3.1.92-.93 4.2C10.74 19.86 10.22 20 9.68 20 8.2 20 7 18.8 7 17.32c0-.52.15-1.02.42-1.45l-1.63-.94C5.29 15.7 5 16.48 5 17.32 5 19.9 7.1 22 9.68 22c1.23 0 2.37-.47 3.22-1.25.86-.78 1.4-1.89 1.47-3.12l.73-3.32 2.9 1.69V19h2v-6h-2.32l-1.54-.9 1.16-2.07c.84.97 2.07 1.67 3.7 1.67z" />
    </svg>
  );
}


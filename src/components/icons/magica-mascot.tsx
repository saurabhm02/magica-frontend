export function MagicaMascot({ className }: { className?: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 95V44C16 31 27 23 39 27C43 17 57 14 65 22C75 14 91 20 91 33C101 34 107 42 105 52C104 59 100 63 96 66V95C96 104 90 108 84 108C77 108 72 103 72 95V72L67 80C63 87 56 87 52 80L47 72V95C47 104 41 108 32 108C23 108 16 103 16 95Z"
        style={{ fill: "rgb(79, 70, 229)" }}
      />
      <ellipse cx="42" cy="51" rx="12" ry="13" fill="white" />
      <ellipse cx="78" cy="51" rx="12" ry="13" fill="white" />
      <circle cx="40.88" cy="53.998" r="3.6" fill="#202024" />
      <circle cx="76.88" cy="53.998" r="3.6" fill="#202024" />
    </svg>
  );
}

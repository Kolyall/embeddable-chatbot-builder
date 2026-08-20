type Props = {
  className?: string;
  size?: number;
};

/**
 * The Parrot brand mark: a stylized parrot head facing right, used as the
 * logo glyph next to the wordmark and as the basis for the app icons.
 * Colors are fixed to the brand palette rather than currentColor so the
 * mark reads consistently on both light surfaces it appears on.
 */
export function ParrotMark({ className, size = 28 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 9C10 13 8 19 9.5 25.5C6 27 4 30.5 4.5 34C7 32.5 9.5 32 11.5 32.5C13.5 38 19 41.5 25.5 41C33.5 40.5 40 34 40 25.5C40 15.5 32 8 22 8C19 8 16.3 8.4 14 9Z"
        fill="#17A673"
      />
      <path
        d="M14 9C16.5 6.5 20 5 23.5 5.5C21.5 8 20 10.8 19.5 14C17 12.5 15 11 14 9Z"
        fill="#0F7D57"
      />
      <path
        d="M31 20C35 20.5 39.5 22.5 43.5 26.5C39 27 35 26.5 31.5 24.5C30.5 22.8 30.3 21.3 31 20Z"
        fill="#F2762E"
      />
      <circle cx="27.5" cy="19.5" r="2.4" fill="#1B221C" />
    </svg>
  );
}

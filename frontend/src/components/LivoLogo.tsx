/**
 * Logo LIVO Hub dùng chung cho frontend web chủ nhà.
 * Badge gradient xanh + chữ L khối (thân dọc trắng + chân ngang xanh băng).
 * size: cạnh badge (px).
 */
export default function LivoLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-label="LIVO Hub"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id="livoHubBadge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0A2A5E" />
          <stop offset="0.52" stopColor="#1E63D6" />
          <stop offset="1" stopColor="#4FB3F5" />
        </linearGradient>
        <linearGradient id="livoHubGloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id="livoHubClip">
          <rect x="0" y="0" width="128" height="128" rx="31" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="128" height="128" rx="31" fill="url(#livoHubBadge)" />
      <g clipPath="url(#livoHubClip)">
        <ellipse cx="58" cy="14" rx="76" ry="40" fill="url(#livoHubGloss)" />
        <ellipse cx="64" cy="132" rx="84" ry="30" fill="#04173A" opacity="0.16" />
      </g>
      {/* Chữ L khối */}
      <rect x="38" y="30" width="22" height="70" rx="6" fill="#FFFFFF" opacity="0.96" />
      <rect x="38" y="78" width="54" height="22" rx="6" fill="#8FE7F7" opacity="0.95" />
    </svg>
  )
}

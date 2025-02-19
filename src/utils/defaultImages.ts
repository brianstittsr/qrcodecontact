// Default profile image (data URL of a simple avatar)
export const defaultProfileImage = 'data:image/svg+xml;base64,' + btoa(`
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#E5E7EB"/>
  <circle cx="64" cy="48" r="24" fill="#9CA3AF"/>
  <path d="M64 80C42.0096 80 24 98.0096 24 120V128H104V120C104 98.0096 85.9904 80 64 80Z" fill="#9CA3AF"/>
</svg>
`);

// Default company logo (data URL of a simple building icon)
export const defaultCompanyLogo = 'data:image/svg+xml;base64,' + btoa(`
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#E5E7EB"/>
  <path d="M24 40H104V112H24V40Z" fill="#9CA3AF"/>
  <path d="M44 56H52V64H44V56Z" fill="#E5E7EB"/>
  <path d="M76 56H84V64H76V56Z" fill="#E5E7EB"/>
  <path d="M44 76H52V84H44V76Z" fill="#E5E7EB"/>
  <path d="M76 76H84V84H76V76Z" fill="#E5E7EB"/>
  <path d="M56 96H72V112H56V96Z" fill="#E5E7EB"/>
  <path d="M64 16L104 40H24L64 16Z" fill="#9CA3AF"/>
</svg>
`);

export const ADMIN_EMAILS = [
  'mujtabamuneer777@gmail.com',
  'chadxkid@gmail.com',
  'twocousins7777@gmail.com',
  'mehroz.muneer@gmail.com',
  'mmahadmuneer@gmail.com',
  'info@defyscale.com',
];

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());

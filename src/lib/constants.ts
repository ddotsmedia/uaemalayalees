export const BUSINESS_CATEGORIES = [
  { slug: 'food-grocery', name: 'Food & Grocery', icon: '🍔' },
  { slug: 'real-estate', name: 'Real Estate', icon: '🏠' },
  { slug: 'money-exchange', name: 'Money Exchange', icon: '💱' },
  { slug: 'recruitment', name: 'Recruitment', icon: '👔' },
  { slug: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { slug: 'legal', name: 'Legal', icon: '⚖️' },
  { slug: 'education', name: 'Education', icon: '🎓' },
  { slug: 'retail', name: 'Retail', icon: '🛍️' },
  { slug: 'automotive', name: 'Automotive', icon: '🚗' },
  { slug: 'construction', name: 'Construction', icon: '🏗️' },
  { slug: 'beauty', name: 'Beauty', icon: '💄' },
  { slug: 'travel', name: 'Travel', icon: '✈️' },
  { slug: 'events', name: 'Events', icon: '🎉' },
  { slug: 'it', name: 'IT & Technology', icon: '💻' },
  { slug: 'logistics', name: 'Logistics', icon: '📦' },
  { slug: 'media', name: 'Media & Marketing', icon: '📺' },
  { slug: 'associations', name: 'Associations', icon: '🤝' },
  { slug: 'other', name: 'Other', icon: '⭐' },
];

export const PERSONAL_CATEGORIES = [
  { slug: 'healthcare-prof', name: 'Healthcare Professionals', icon: '⚕️' },
  { slug: 'engineers', name: 'Engineers', icon: '🔧' },
  { slug: 'teachers', name: 'Teachers', icon: '👨‍🏫' },
  { slug: 'legal-prof', name: 'Legal Professionals', icon: '👨‍⚖️' },
  { slug: 'finance', name: 'Finance & Accounting', icon: '📊' },
  { slug: 'business-owners', name: 'Business Owners', icon: '👨‍💼' },
  { slug: 'creative', name: 'Creative Professionals', icon: '🎨' },
  { slug: 'trades', name: 'Trades & Crafts', icon: '🛠️' },
  { slug: 'general', name: 'General', icon: '👤' },
];

export const EMIRATES = [
  { slug: 'abu-dhabi', name: 'Abu Dhabi', cities: ['Abu Dhabi', 'Al Ain', 'Madinat Zayed'] },
  { slug: 'dubai', name: 'Dubai', cities: ['Dubai', 'Jebel Ali', 'Hatta'] },
  { slug: 'sharjah', name: 'Sharjah', cities: ['Sharjah', 'Khor Fakkan', 'Kalba'] },
  { slug: 'ajman', name: 'Ajman', cities: ['Ajman', 'Manama'] },
  { slug: 'umm-al-quwain', name: 'Umm Al Quwain', cities: ['Umm Al Quwain'] },
  { slug: 'fujairah', name: 'Fujairah', cities: ['Fujairah'] },
  { slug: 'ras-al-khaimah', name: 'Ras Al Khaimah', cities: ['Ras Al Khaimah'] },
];

export const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
];

export const VERIFICATION_TYPES = ['EMAIL', 'PHONE', 'TRADELIT'] as const;

export const REPORT_REASONS = [
  { value: 'FAKE_PROFILE', label: 'Fake Profile' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 3;
export const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

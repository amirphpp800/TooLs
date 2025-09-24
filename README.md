# Pro TooLs - ابزارهای دیجیتال پیشرفته

## Overview
Pro TooLs is a comprehensive digital tools platform providing advanced configurations, panels, and applications for various operating systems and networking solutions.

## Features
- **Multi-Platform Support**: iOS, Android, Windows applications
- **DNS Management**: Advanced DNS server configurations and scanner
- **VPN Solutions**: OpenVPN and WireGuard configurations
- **Web Panels**: HTML5 and Python-based control panels
- **User Authentication**: Secure Telegram-based registration system
- **Admin Dashboard**: Comprehensive management interface

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare KV Storage
- **Authentication**: HMAC-based sessions with Telegram integration
- **Design System**: Material Design 3 principles with RTL support

## Installation

### Prerequisites
- Node.js 18+ (for development)
- Cloudflare account (for deployment)

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd TooLs-main

# Install dependencies (if using build tools)
npm install

# Start local development server
npx wrangler pages dev .
```

### Deployment
```bash
# Deploy to Cloudflare Pages
npx wrangler pages deploy .
```

## Project Structure
```
├── Pages/                 # Individual page components
│   ├── android/          # Android-specific content
│   ├── ios/             # iOS-specific content
│   ├── windows/         # Windows-specific content
│   └── *.html           # Various service pages
├── dashboard/           # Admin and user dashboards
│   ├── admin/          # Administrative interface
│   └── user/           # User account management
├── functions/          # Cloudflare Pages Functions (API)
│   ├── api/           # API endpoints
│   └── _utils.js      # Shared utilities
├── icons/             # SVG and PNG icons
├── Font/              # Custom Persian fonts (DanaFaNum)
├── styles.css         # Main stylesheet
├── script.js          # Main JavaScript file
└── manifest.webmanifest # PWA manifest

```

## Configuration

### Environment Variables
Set these in your Cloudflare Pages environment:
- `SECRET`: HMAC signing secret for sessions
- `DATABASE`: KV namespace binding for data storage

### Content Security Policy
The application uses a strict CSP. Update the meta tag in HTML files if adding new external resources.

## API Endpoints
- `/api/auth/status` - Check authentication status
- `/api/register/start` - Start registration process
- `/api/register/verify` - Verify registration code
- `/api/favorites` - Manage user favorites
- `/api/admin/*` - Administrative functions

## Development Guidelines

### Code Style
- Use semantic HTML5 elements
- Follow BEM methodology for CSS classes
- Use modern JavaScript (ES6+) features
- Maintain RTL (right-to-left) text direction support

### Performance
- Lazy load images with `data-src` attribute
- Use CSS containment for performance-critical sections
- Minimize use of `!important` declarations
- Implement proper caching strategies

### Accessibility
- Maintain ARIA labels and roles
- Support keyboard navigation
- Ensure proper color contrast
- Test with screen readers

## Security
- All user inputs are validated and sanitized
- CSRF protection on state-changing operations
- Secure session management with HMAC
- Content Security Policy enforcement

## Browser Support
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes following the code style guidelines
4. Test thoroughly across different devices and browsers
5. Submit a pull request with detailed description

## License
All rights reserved. This project is proprietary software developed by the Pro TooLs team.

## Support
For technical support or questions:
- Telegram: @Minimalcraft (Admin 1)
- Telegram: @NeoDebug (Admin 2)

---
*بیش از 2 سال تجربه در ارائه بهترین ابزارهای دیجیتال*

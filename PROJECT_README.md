# World's Most Cliché Type-Safe Web App 🎯

A fully type-safe React + TypeScript web application featuring generic forms for ordering parts and contacting customer support. Built with modern best practices and deployed to GitHub Pages.

## 🚀 Features

- **100% Type-Safe**: Built with TypeScript and strict mode enabled
- **React 18**: Modern React with hooks and functional components
- **Type-Safe Forms**: Comprehensive validation with TypeScript interfaces
- **Responsive Design**: Mobile-friendly CSS with modern styling
- **Client-Side Routing**: React Router for seamless navigation
- **GitHub Pages Ready**: Pre-configured for GitHub Pages deployment

## 📦 Tech Stack

- **Framework**: React 18.3
- **Language**: TypeScript 5.4
- **Build Tool**: Vite 5.2
- **Router**: React Router DOM 6.22
- **Deployment**: GitHub Pages

## 🎨 Pages

### Home (Order Parts)
A comprehensive form for ordering parts from a manufacturer with:
- Customer information (name, email, company)
- Part details (part number, description, quantity, urgency)
- Delivery information (address, special notes)
- Real-time validation
- Form submission with order ID generation

### Contact (Customer Support)
A customer support contact form featuring:
- Personal information (name, email, phone)
- Inquiry categorization (general, technical, billing, complaint)
- Preferred contact method selection
- Message composition with character counter
- Ticket ID generation upon submission

## 🛠️ Setup & Development

### Prerequisites
- Node.js 20+ (recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server
The app will be available at `http://localhost:5173/support-repo/`

## 📁 Project Structure

```
support-repo/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Main layout with navigation
│   ├── pages/
│   │   ├── Home.tsx            # Order parts form page
│   │   └── Contact.tsx         # Contact support form page
│   ├── types/
│   │   └── forms.ts            # TypeScript type definitions
│   ├── styles/
│   │   ├── global.css          # Global styles and variables
│   │   ├── layout.css          # Layout component styles
│   │   └── forms.css           # Form component styles
│   ├── App.tsx                 # Root component with routes
│   └── main.tsx                # Application entry point
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## 🎯 TypeScript Features

### Strict Type Safety
- Strict mode enabled with all checks
- No implicit `any` types
- Exhaustive form validation with typed errors
- Type-safe event handlers

### Type Definitions
```typescript
interface PartOrder {
  customerName: string;
  email: string;
  companyName: string;
  partNumber: string;
  partDescription: string;
  quantity: number;
  urgency: 'standard' | 'expedited' | 'rush';
  deliveryAddress: string;
  additionalNotes: string;
}

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: 'technical' | 'billing' | 'general' | 'complaint';
  message: string;
  preferredContactMethod: 'email' | 'phone';
}
```

## 🚀 Deployment

### GitHub Pages

#### Option 1: GitHub Actions (Recommended)
The repository includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on every push to `main`.

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Push to main branch

#### Option 2: Manual Deployment
```bash
npm run build
npm run deploy
```

### Configuration
The app is configured for deployment at `/support-repo/` base path. To change this:
1. Update `base` in `vite.config.ts`
2. Update `basename` in `src/main.tsx`

## 🧪 Form Validation

Both forms include comprehensive client-side validation:

- **Required fields**: Enforced with visual indicators
- **Email validation**: RFC-compliant email format checking
- **Phone validation**: Required when phone is preferred contact method
- **Message length**: Minimum character requirements
- **Quantity validation**: Minimum value constraints
- **Real-time feedback**: Errors clear as user types

## 🎨 Design System

The app uses a consistent design system with CSS variables:
- Primary color: Blue (#2563eb)
- Success color: Green (#10b981)
- Error color: Red (#ef4444)
- Responsive breakpoint: 768px
- Modern shadow and spacing system

## 📝 License

MIT License - feel free to use this project as a template for your own type-safe React applications!

## 🤝 Contributing

This is a demonstration project, but feel free to fork and customize for your needs!

---

Built with ❤️ using React + TypeScript + Vite

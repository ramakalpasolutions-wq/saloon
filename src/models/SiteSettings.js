import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema({
  // Site Branding
  siteName: {
    type: String,
    default: 'Green Saloon',
  },
  logo: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  favicon: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },

  // Header Settings
  headerSettings: {
    showLogo: {
      type: Boolean,
      default: true,
    },
    navigationLinks: [
      {
        label: String,
        url: String,
        openInNewTab: {
          type: Boolean,
          default: false,
        },
      },
    ],
    ctaButtons: [
      {
        label: String,
        url: String,
        style: {
          type: String,
          enum: ['primary', 'secondary', 'outline'],
          default: 'primary',
        },
      },
    ],
    backgroundColor: {
      type: String,
      default: '#ffffff',
    },
    textColor: {
      type: String,
      default: '#000000',
    },
  },

  // Hero Section
  heroSection: {
    title: {
      type: String,
      default: 'That fresh haircut feeling—faster',
    },
    subtitle: {
      type: String,
      default: 'Great haircuts are easier with Online Check-In',
    },
    description: {
      type: String,
      default: 'Find a salon near you and add your name to the waitlist from anywhere, with Online Check-In.',
    },
    backgroundImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    ctaButtonText: {
      type: String,
      default: 'Check in',
    },
  },

  // App Showcase Section
  appShowcaseSection: {
    title: {
      type: String,
      default: 'A great haircut every time, on your schedule',
    },
    description: {
      type: String,
      default: 'Get the look you love with convenient haircuts that fit into your busy life.',
    },
    buttonText: {
      type: String,
      default: 'DOWNLOAD THE APP',
    },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },

  // Quick Check-in Section
  quickCheckinSection: {
    title: {
      type: String,
      default: 'Quick and easy check-in when you\'re on the go',
    },
    description: {
      type: String,
      default: 'Spend less time waiting and more time on what matters to you.',
    },
    backgroundImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    showEmailSignup: {
      type: Boolean,
      default: true,
    },
  },

  // Haircuts Section
  haircutsSection: {
    title: {
      type: String,
      default: 'Great haircuts for everyone',
    },
    subtitle: {
      type: String,
      default: 'Get a haircut that fits your hair, your lifestyle and your look.',
    },
    categories: [
      {
        title: String,
        label: String,
        buttonText: String,
        image: {
          url: { type: String, default: '' },
          publicId: { type: String, default: '' },
        },
      },
    ],
  },

  // Additional Services Section
  servicesSection: {
    label: {
      type: String,
      default: 'ADDITIONAL',
    },
    title: {
      type: String,
      default: 'Haircare Services',
    },
    description: {
      type: String,
      default: 'Beyond great haircuts, we offer additional services to keep you looking and feeling your best.',
    },
    buttonText: {
      type: String,
      default: 'Learn more',
    },
    backgroundImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },

  // Schedule Section
  scheduleSection: {
    title: {
      type: String,
      default: 'A great haircut every time, on your schedule',
    },
    description: {
      type: String,
      default: 'Get the look you love with convenient haircuts that fit into your busy life.',
    },
    buttonText: {
      type: String,
      default: 'Find a Salon',
    },
    backgroundImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },

  // News Section
  newsSection: {
    title: {
      type: String,
      default: 'Great news',
    },
    articles: [
      {
        title: String,
        description: String,
        buttonText: String,
      },
    ],
  },

  // Contact Info
  contactInfo: {
    email: String,
    phone: String,
    address: String,
  },

  // Social Media
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
  },

  // Footer Settings
  footerSettings: {
    showSocialMedia: {
      type: Boolean,
      default: true,
    },
    showContactInfo: {
      type: Boolean,
      default: true,
    },
    copyrightText: String,
    backgroundColor: {
      type: String,
      default: '#f3f4f6',
    },
    textColor: {
      type: String,
      default: '#4b5563',
    },
  },

  // Footer Links
  footerLinks: [
    {
      text: String,
      url: String,
    },
  ],

  // Colors
  colors: {
    primary: {
      type: String,
      default: '#16a34a',
    },
    secondary: {
      type: String,
      default: '#059669',
    },
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);

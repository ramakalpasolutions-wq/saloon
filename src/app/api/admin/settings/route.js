import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';
import { getUserFromRequest } from '@/lib/auth';

// Helper function to clean undefined values from objects
function cleanUndefined(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNested = cleanUndefined(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item => 
        typeof item === 'object' ? cleanUndefined(item) : item
      );
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// GET - Public access to settings (no auth required)
export async function GET(request) {
  try {
    await connectDB();

    // Get or create default settings
    let settings = await SiteSettings.findOne();
    
    if (!settings) {
      settings = await SiteSettings.create({
        siteName: 'Green Saloon',
        heroSection: {
          title: 'That fresh haircut feeling—faster',
          subtitle: 'Great haircuts are easier with Online Check-In',
          description: 'Find a salon near you and add your name to the waitlist from anywhere, with Online Check-In.',
          ctaButtonText: 'Check in',
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Only main admin can update
export async function PUT(request) {
  try {
    const userData = getUserFromRequest(request);
    
    if (!userData || userData.role !== 'main-admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Main admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    const updates = await request.json();
    
    // Clean undefined values
    const cleanedUpdates = cleanUndefined(updates);

    // Get or create settings
    let settings = await SiteSettings.findOne();
    
    if (!settings) {
      settings = await SiteSettings.create(cleanedUpdates);
    } else {
      // Deep merge for nested objects - only if they exist
      if (cleanedUpdates.heroSection) {
        settings.heroSection = { 
          ...settings.heroSection?.toObject?.() || settings.heroSection || {}, 
          ...cleanedUpdates.heroSection 
        };
      }
      if (cleanedUpdates.appShowcaseSection) {
        settings.appShowcaseSection = { 
          ...settings.appShowcaseSection?.toObject?.() || settings.appShowcaseSection || {}, 
          ...cleanedUpdates.appShowcaseSection 
        };
      }
      if (cleanedUpdates.quickCheckinSection) {
        settings.quickCheckinSection = { 
          ...settings.quickCheckinSection?.toObject?.() || settings.quickCheckinSection || {}, 
          ...cleanedUpdates.quickCheckinSection 
        };
      }
      if (cleanedUpdates.haircutsSection) {
        settings.haircutsSection = { 
          ...settings.haircutsSection?.toObject?.() || settings.haircutsSection || {}, 
          ...cleanedUpdates.haircutsSection 
        };
      }
      if (cleanedUpdates.servicesSection) {
        settings.servicesSection = { 
          ...settings.servicesSection?.toObject?.() || settings.servicesSection || {}, 
          ...cleanedUpdates.servicesSection 
        };
      }
      if (cleanedUpdates.scheduleSection) {
        settings.scheduleSection = { 
          ...settings.scheduleSection?.toObject?.() || settings.scheduleSection || {}, 
          ...cleanedUpdates.scheduleSection 
        };
      }
      if (cleanedUpdates.newsSection) {
        settings.newsSection = { 
          ...settings.newsSection?.toObject?.() || settings.newsSection || {}, 
          ...cleanedUpdates.newsSection 
        };
      }
      if (cleanedUpdates.contactInfo) {
        settings.contactInfo = { 
          ...settings.contactInfo?.toObject?.() || settings.contactInfo || {}, 
          ...cleanedUpdates.contactInfo 
        };
      }
      if (cleanedUpdates.socialMedia) {
        settings.socialMedia = { 
          ...settings.socialMedia?.toObject?.() || settings.socialMedia || {}, 
          ...cleanedUpdates.socialMedia 
        };
      }
      if (cleanedUpdates.headerSettings) {
        settings.headerSettings = { 
          ...settings.headerSettings?.toObject?.() || settings.headerSettings || {}, 
          ...cleanedUpdates.headerSettings 
        };
      }
      if (cleanedUpdates.footerSettings) {
        settings.footerSettings = { 
          ...settings.footerSettings?.toObject?.() || settings.footerSettings || {}, 
          ...cleanedUpdates.footerSettings 
        };
      }
      if (cleanedUpdates.colors) {
        settings.colors = { 
          ...settings.colors?.toObject?.() || settings.colors || {}, 
          ...cleanedUpdates.colors 
        };
      }
      
      // Direct updates
      if (cleanedUpdates.siteName !== undefined) settings.siteName = cleanedUpdates.siteName;
      if (cleanedUpdates.logo) settings.logo = cleanedUpdates.logo;
      if (cleanedUpdates.favicon) settings.favicon = cleanedUpdates.favicon;
      if (cleanedUpdates.footerLinks) settings.footerLinks = cleanedUpdates.footerLinks;
      
      settings.updatedAt = new Date();
      
      // Use markModified for nested objects
      settings.markModified('heroSection');
      settings.markModified('appShowcaseSection');
      settings.markModified('quickCheckinSection');
      settings.markModified('haircutsSection');
      settings.markModified('servicesSection');
      settings.markModified('scheduleSection');
      settings.markModified('newsSection');
      settings.markModified('contactInfo');
      settings.markModified('socialMedia');
      settings.markModified('headerSettings');
      settings.markModified('footerSettings');
      
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}

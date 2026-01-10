'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/components/Toast';

export default function SiteSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState({
    siteName: 'Green Saloon',
    logo: { url: '', publicId: '' },
    heroSection: {
      title: 'That fresh haircut feeling—faster',
      subtitle: 'Great haircuts are easier with Online Check-In',
      description: 'Find a salon near you and add your name to the waitlist from anywhere',
      backgroundImage: { url: '', publicId: '' },
      ctaButtonText: 'Check in',
    },
    appShowcaseSection: {
      title: 'A great haircut every time, on your schedule',
      description: 'Get the look you love with convenient haircuts that fit into your busy life.',
      buttonText: 'DOWNLOAD THE APP',
      image: { url: '', publicId: '' },
    },
    quickCheckinSection: {
      title: 'Quick and easy check-in when you\'re on the go',
      description: 'Spend less time waiting and more time on what matters to you.',
      backgroundImage: { url: '', publicId: '' },
      showEmailSignup: true,
    },
    haircutsSection: {
      title: 'Great haircuts for everyone',
      subtitle: 'Get a haircut that fits your hair, your lifestyle and your look.',
      categories: [
        { title: 'Men', label: 'HAIRCUTS FOR', buttonText: 'Show me', image: { url: '', publicId: '' } },
        { title: 'Women', label: 'HAIRCUTS FOR', buttonText: 'Show me', image: { url: '', publicId: '' } },
        { title: 'Kids', label: 'HAIRCUTS FOR', buttonText: 'Show me', image: { url: '', publicId: '' } },
        { title: 'Seniors', label: 'HAIRCUTS FOR', buttonText: 'Show me', image: { url: '', publicId: '' } },
      ],
    },
    servicesSection: {
      label: 'ADDITIONAL',
      title: 'Haircare Services',
      description: 'Beyond great haircuts, we offer additional services to keep you looking and feeling your best.',
      buttonText: 'Learn more',
      backgroundImage: { url: '', publicId: '' },
    },
    scheduleSection: {
      title: 'A great haircut every time, on your schedule',
      description: 'Get the look you love with convenient haircuts that fit into your busy life.',
      buttonText: 'Find a Salon',
      backgroundImage: { url: '', publicId: '' },
    },
    newsSection: {
      title: 'Great news',
      articles: [
        { title: 'Taper, fade, or undercut?', description: 'We\'re breaking down these hairstyles so you can find out which one suits you best.', buttonText: 'Read more' },
        { title: 'Find your next great cut', description: 'From layers to fades, our lookbook is here to inspire what\'s next for your hair.', buttonText: 'Browse haircuts' },
        { title: 'Work greatly', description: 'Grow your career at a salon, whether that\'s as a stylist, manager or receptionist.', buttonText: 'Learn more' },
      ],
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, section, field, index = null) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'site-settings');

    try {
      toast.info('Uploading image...');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        if (section && index !== null) {
          setSettings(prev => {
            const newCategories = [...prev[section].categories];
            newCategories[index] = {
              ...newCategories[index],
              [field]: { url: data.url, publicId: data.publicId }
            };
            return {
              ...prev,
              [section]: { ...prev[section], categories: newCategories }
            };
          });
        } else if (section) {
          setSettings(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: { url: data.url, publicId: data.publicId } }
          }));
        } else {
          setSettings(prev => ({
            ...prev,
            [field]: { url: data.url, publicId: data.publicId }
          }));
        }

        toast.success('Image uploaded successfully!');
        setTimeout(() => handleSave(), 500);
        
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings saved successfully!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const addNewsArticle = () => {
    setSettings(prev => ({
      ...prev,
      newsSection: {
        ...prev.newsSection,
        articles: [...prev.newsSection.articles, { title: '', description: '', buttonText: 'Read more' }]
      }
    }));
  };

  const removeNewsArticle = (index) => {
    setSettings(prev => ({
      ...prev,
      newsSection: {
        ...prev.newsSection,
        articles: prev.newsSection.articles.filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <AdminLayout requiredRole="main-admin">
        <div className="flex flex-col items-center justify-center h-64 px-3">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { id: 'branding', label: 'Branding', emoji: '🎨' },
    { id: 'hero', label: 'Hero Section', emoji: '🌟' },
    { id: 'app', label: 'App Showcase', emoji: '📱' },
    { id: 'checkin', label: 'Quick Check-in', emoji: '✅' },
    { id: 'haircuts', label: 'Haircuts', emoji: '✂️' },
    { id: 'services', label: 'Services', emoji: '💇' },
    { id: 'schedule', label: 'Schedule', emoji: '📅' },
    { id: 'news', label: 'News', emoji: '📰' },
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <AdminLayout requiredRole="main-admin">
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Site Settings</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Customize your entire website from one place</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg font-semibold text-white transition-colors shadow-lg text-sm sm:text-base ${
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {saving ? '⏳ Saving...' : '💾 Save All'}
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
            Select Section to Edit:
          </label>
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-4 py-3 sm:px-5 sm:py-4 pr-10 sm:pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white text-gray-900 font-medium text-sm sm:text-lg cursor-pointer hover:border-green-400 transition-colors"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>
                  {tab.emoji} {tab.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 sm:px-4 text-gray-700">
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center gap-2">
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-100 text-green-800 rounded-full font-medium text-xs sm:text-sm">
              Currently Editing: {currentTab?.emoji} {currentTab?.label}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 border border-gray-200">
          
          {/* BRANDING TAB */}
          {activeTab === 'branding' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b">
                <span className="text-3xl sm:text-4xl">🎨</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Site Branding</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Logo and site name settings</p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName || ''}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  placeholder="Green Saloon"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Logo</label>
                {settings.logo?.url && (
                  <div className="mb-3">
                    <img src={settings.logo.url} alt="Logo" className="w-32 h-32 sm:w-40 sm:h-40 object-contain bg-gray-50 p-3 sm:p-4 rounded-lg border-2 border-gray-200" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], null, 'logo')}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-black rounded-lg file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:cursor-pointer text-xs sm:text-sm"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2">Recommended: PNG with transparent background, 200x200px</p>
                <p className="text-xs text-orange-600 mt-1">✨ Images auto-save after upload!</p>
              </div>
            </div>
          )}

          {/* HERO TAB */}
          {activeTab === 'hero' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b">
                <span className="text-3xl sm:text-4xl">🌟</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Hero Section</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Main homepage banner</p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={settings.heroSection?.title || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    heroSection: { ...settings.heroSection, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={settings.heroSection?.subtitle || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    heroSection: { ...settings.heroSection, subtitle: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={settings.heroSection?.description || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    heroSection: { ...settings.heroSection, description: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">CTA Button Text</label>
                <input
                  type="text"
                  value={settings.heroSection?.ctaButtonText || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    heroSection: { ...settings.heroSection, ctaButtonText: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Background Image</label>
                {settings.heroSection?.backgroundImage?.url && (
                  <img src={settings.heroSection.backgroundImage.url} alt="Hero" className="w-full h-48 sm:h-64 object-cover mb-3 rounded-lg border-2 border-gray-200" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'heroSection', 'backgroundImage')}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-black rounded-lg file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:cursor-pointer text-xs sm:text-sm"
                />
                <p className="text-xs text-orange-600 mt-2">✨ Images auto-save after upload!</p>
              </div>
            </div>
          )}

          {/* APP SHOWCASE TAB */}
          {activeTab === 'app' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b">
                <span className="text-3xl sm:text-4xl">📱</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">App Showcase Section</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Mobile app promotion section</p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={settings.appShowcaseSection?.title || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    appShowcaseSection: { ...settings.appShowcaseSection, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={settings.appShowcaseSection?.description || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    appShowcaseSection: { ...settings.appShowcaseSection, description: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Button Text</label>
                <input
                  type="text"
                  value={settings.appShowcaseSection?.buttonText || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    appShowcaseSection: { ...settings.appShowcaseSection, buttonText: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Showcase Image</label>
                {settings.appShowcaseSection?.image?.url && (
                  <img src={settings.appShowcaseSection.image.url} alt="App Showcase" className="w-full h-48 sm:h-64 object-cover mb-3 rounded-lg border-2 border-gray-200" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'appShowcaseSection', 'image')}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg file:mr-3 sm:file:mr-4 text-black file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:cursor-pointer text-xs sm:text-sm"
                />
                <p className="text-xs text-orange-600 mt-2">✨ Images auto-save after upload!</p>
              </div>
            </div>
          )}

          {/* QUICK CHECK-IN TAB */}
          {activeTab === 'checkin' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b">
                <span className="text-3xl sm:text-4xl">✅</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Quick Check-in Section</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Email signup section</p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={settings.quickCheckinSection?.title || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    quickCheckinSection: { ...settings.quickCheckinSection, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={settings.quickCheckinSection?.description || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    quickCheckinSection: { ...settings.quickCheckinSection, description: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.quickCheckinSection?.showEmailSignup !== false}
                    onChange={(e) => setSettings({
                      ...settings,
                      quickCheckinSection: { ...settings.quickCheckinSection, showEmailSignup: e.target.checked }
                    })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">Show Email Signup Form</span>
                </label>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Background Image</label>
                {settings.quickCheckinSection?.backgroundImage?.url && (
                  <img src={settings.quickCheckinSection.backgroundImage.url} alt="Quick Check-in" className="w-full h-48 sm:h-64 object-cover mb-3 rounded-lg border-2 border-gray-200" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'quickCheckinSection', 'backgroundImage')}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg text-black file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:cursor-pointer text-xs sm:text-sm"
                />
                <p className="text-xs text-orange-600 mt-2">✨ Images auto-save after upload!</p>
              </div>
            </div>
          )}

          {/* HAIRCUTS TAB */}
          {activeTab === 'haircuts' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b">
                <span className="text-3xl sm:text-4xl">✂️</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Haircuts Section</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Categories for different customers</p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Section Title</label>
                <input
                  type="text"
                  value={settings.haircutsSection?.title || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    haircutsSection: { ...settings.haircutsSection, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={settings.haircutsSection?.subtitle || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    haircutsSection: { ...settings.haircutsSection, subtitle: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-4 sm:space-y-6">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900">Categories</h3>
                {settings.haircutsSection?.categories?.map((category, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Category {index + 1}: {category.title}</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={category.title || ''}
                          onChange={(e) => {
                            const newCategories = [...settings.haircutsSection.categories];
                            newCategories[index] = { ...newCategories[index], title: e.target.value };
                            setSettings({
                              ...settings,
                              haircutsSection: { ...settings.haircutsSection, categories: newCategories }
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Label</label>
                        <input
                          type="text"
                          value={category.label || ''}
                          onChange={(e) => {
                            const newCategories = [...settings.haircutsSection.categories];
                            newCategories[index] = { ...newCategories[index], label: e.target.value };
                            setSettings({
                              ...settings,
                              haircutsSection: { ...settings.haircutsSection, categories: newCategories }
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={category.buttonText || ''}
                          onChange={(e) => {
                            const newCategories = [...settings.haircutsSection.categories];
                            newCategories[index] = { ...newCategories[index], buttonText: e.target.value };
                            setSettings({
                              ...settings,
                              haircutsSection: { ...settings.haircutsSection, categories: newCategories }
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Image</label>
                        {category.image?.url && (
                          <img src={category.image.url} alt={category.title} className="w-full h-24 sm:h-32 object-cover mb-2 rounded-lg" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e.target.files[0], 'haircutsSection', 'image', index)}
                          className="w-full text-xs sm:text-sm file:mr-2 file:py-1 file:px-2 sm:file:px-3 file:rounded file:border-0 file:bg-green-50 file:text-green-700 file:text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b">
                <span className="text-3xl sm:text-4xl">💇</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Services Section</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Additional haircare services</p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Label</label>
                <input
                  type="text"
                  value={settings.servicesSection?.label || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    servicesSection: { ...settings.servicesSection, label: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={settings.servicesSection?.title || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    servicesSection: { ...settings.servicesSection, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={settings.servicesSection?.description || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    servicesSection: { ...settings.servicesSection, description: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Button Text</label>
                <input
                  type="text"
                  value={settings.servicesSection?.buttonText || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    servicesSection: { ...settings.servicesSection, buttonText: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Background Image</label>
                {settings.servicesSection?.backgroundImage?.url && (
                  <img src={settings.servicesSection.backgroundImage.url} alt="Services" className="w-full h-48 sm:h-64 object-cover mb-3 rounded-lg border-2 border-gray-200" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'servicesSection', 'backgroundImage')}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg text-black file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:cursor-pointer text-xs sm:text-sm"
                />
                <p className="text-xs text-orange-600 mt-2">✨ Images auto-save after upload!</p>
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b">
                <span className="text-3xl sm:text-4xl">📅</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Schedule Section</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Call-to-action for finding salons</p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={settings.scheduleSection?.title || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    scheduleSection: { ...settings.scheduleSection, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={settings.scheduleSection?.description || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    scheduleSection: { ...settings.scheduleSection, description: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Button Text</label>
                <input
                  type="text"
                  value={settings.scheduleSection?.buttonText || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    scheduleSection: { ...settings.scheduleSection, buttonText: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Background Image</label>
                {settings.scheduleSection?.backgroundImage?.url && (
                  <img src={settings.scheduleSection.backgroundImage.url} alt="Schedule" className="w-full h-48 sm:h-64 object-cover mb-3 rounded-lg border-2 border-gray-200" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'scheduleSection', 'backgroundImage')}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg file:mr-3 sm:file:mr-4 text-black file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:cursor-pointer text-xs sm:text-sm"
                />
                <p className="text-xs text-orange-600 mt-2">✨ Images auto-save after upload!</p>
              </div>
            </div>
          )}

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl">📰</span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">News Section</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Articles and updates</p>
                  </div>
                </div>
                <button
                  onClick={addNewsArticle}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  + Add Article
                </button>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Section Title</label>
                <input
                  type="text"
                  value={settings.newsSection?.title || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    newsSection: { ...settings.newsSection, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-3 sm:space-y-4">
                {settings.newsSection?.articles?.map((article, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Article {index + 1}</h3>
                      <button
                        onClick={() => removeNewsArticle(index)}
                        className="px-2 py-1 sm:px-3 sm:py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs sm:text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={article.title || ''}
                          onChange={(e) => {
                            const newArticles = [...settings.newsSection.articles];
                            newArticles[index] = { ...newArticles[index], title: e.target.value };
                            setSettings({
                              ...settings,
                              newsSection: { ...settings.newsSection, articles: newArticles }
                            });
                          }}
                          className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 text-gray-900 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={article.description || ''}
                          onChange={(e) => {
                            const newArticles = [...settings.newsSection.articles];
                            newArticles[index] = { ...newArticles[index], description: e.target.value };
                            setSettings({
                              ...settings,
                              newsSection: { ...settings.newsSection, articles: newArticles }
                            });
                          }}
                          rows={3}
                          className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 text-gray-900 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={article.buttonText || ''}
                          onChange={(e) => {
                            const newArticles = [...settings.newsSection.articles];
                            newArticles[index] = { ...newArticles[index], buttonText: e.target.value };
                            setSettings({
                              ...settings,
                              newsSection: { ...settings.newsSection, articles: newArticles }
                            });
                          }}
                          className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 text-gray-900 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}

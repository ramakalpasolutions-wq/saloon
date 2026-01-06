'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    console.log('Email submitted:', email);
    alert('Thank you for signing up!');
    setEmail('');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </>
    );
  }

  const hero = settings?.heroSection || {};
  const appShowcase = settings?.appShowcaseSection || {};
  const quickCheckin = settings?.quickCheckinSection || {};
  const haircuts = settings?.haircutsSection || {};
  const services = settings?.servicesSection || {};
  const schedule = settings?.scheduleSection || {};
  const news = settings?.newsSection || {};

  return (
    <>
      {/* Header Component */}
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Hero Section */}
      <section className="relative h-[600px] bg-gray-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: hero.backgroundImage?.url
              ? `url('${hero.backgroundImage.url}')`
              : "url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074')",
            filter: 'brightness(0.6)'
          }}
        />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4 max-w-4xl">
            {hero.title || 'That fresh haircut feeling—faster'}
          </h2>
          <p className="text-xl md:text-2xl text-white mb-3 max-w-2xl">
            {hero.subtitle || 'Great haircuts are easier with Online Check-In'}
          </p>
          <p className="text-lg text-white mb-8 max-w-3xl opacity-90">
            {hero.description || 'Find a salon near you and add your name to the waitlist from anywhere, with Online Check-In.'}
          </p>
          <Link href="/map">
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center gap-2 transition-colors">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {hero.ctaButtonText || 'Check in'}
            </button>
          </Link>
        </div>
      </section>

      {/* App Showcase Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">
                {appShowcase.title || 'A great haircut every time, on your schedule'}
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                {appShowcase.description || 'Get the look you love with convenient haircuts that fit into your busy life.'}
              </p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                {appShowcase.buttonText || 'DOWNLOAD THE APP'}
              </button>
            </div>
            <div className="relative h-[500px]">
              {appShowcase.image?.url ? (
                <img
                  src={appShowcase.image.url}
                  alt="App Showcase"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-300 to-gray-200 rounded-2xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-400 text-center">
                      <svg className="h-20 w-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">App Screenshots</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Check-in Section - ALWAYS VISIBLE INPUT */}
      {quickCheckin.showEmailSignup !== false && (
        <section className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center py-20">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: quickCheckin.backgroundImage?.url
                ? `url('${quickCheckin.backgroundImage.url}')`
                : "url('https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2070')",
              filter: 'brightness(0.4)'
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              {quickCheckin.title || 'Quick and easy check-in when you\'re on the go'}
            </h3>
            <p className="text-lg sm:text-xl text-white mb-6 sm:mb-8 opacity-90 max-w-3xl mx-auto">
              {quickCheckin.description || 'Spend less time waiting and more time on what matters to you.'}
            </p>

            {/* Email Signup Form - High Visibility */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full sm:flex-1 px-6 py-4 rounded-lg bg-white text-gray-900 text-base sm:text-lg placeholder-gray-500 border-2 border-white focus:ring-4 focus:ring-green-500 focus:border-green-600 outline-none transition-all shadow-2xl"
              />
              <button
                type="submit"
                className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-lg text-base sm:text-lg font-semibold whitespace-nowrap transition-all focus:ring-4 focus:ring-green-400 outline-none shadow-2xl"
              >
                Sign Up
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Haircuts for Everyone Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              {haircuts.title || 'Great haircuts for everyone'}
            </h3>
            <p className="text-xl text-gray-600">
              {haircuts.subtitle || 'Get a haircut that fits your hair, your lifestyle and your look.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {haircuts.categories && haircuts.categories.length > 0 ? (
              haircuts.categories.map((category, index) => (
                <div key={index} className="relative h-[400px] rounded-2xl overflow-hidden group cursor-pointer">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundImage: `url('${category.image?.url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070'}')`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-sm uppercase tracking-wide mb-2 opacity-90">{category.label || 'HAIRCUTS FOR'}</p>
                    <h4 className="text-3xl font-bold mb-4">{category.title}</h4>
                    <button className="border-2 border-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors">
                      {category.buttonText || 'Show me'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <>
                {['Men', 'Women', 'Kids', 'Seniors'].map((category, index) => (
                  <div key={index} className="relative h-[400px] rounded-2xl overflow-hidden group cursor-pointer">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-${index === 0 ? '1503951914875-452162b0f3f1' :
                          index === 1 ? '1560869713-bf21c8d02f06' :
                            index === 2 ? '1503944583220-79d8926ad5e2' :
                              '1595475207225-428b62bda831'
                          }?q=80&w=2070')`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <p className="text-sm uppercase tracking-wide mb-2 opacity-90">HAIRCUTS FOR</p>
                      <h4 className="text-3xl font-bold mb-4">{category}</h4>
                      <button className="border-2 border-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors">
                        Show me
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Haircare Services Section */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: services.backgroundImage?.url
              ? `url('${services.backgroundImage.url}')`
              : "url('https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2069')",
            filter: 'brightness(0.3)'
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-wide text-green-400 mb-4">
            {services.label || 'ADDITIONAL'}
          </p>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {services.title || 'Haircare Services'}
          </h3>
          <p className="text-xl text-white mb-8 opacity-90">
            {services.description || 'Beyond great haircuts, we offer additional services to keep you looking and feeling your best.'}
          </p>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors">
            {services.buttonText || 'Learn more'}
          </button>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[500px] bg-gray-900 rounded-2xl overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: schedule.backgroundImage?.url
                    ? `url('${schedule.backgroundImage.url}')`
                    : "url('https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070')",
                  filter: 'brightness(0.5)'
                }}
              />
              <div className="relative z-10 h-full flex items-center justify-center text-center p-8">
                <div>
                  <h3 className="text-4xl font-bold text-white mb-4">
                    {schedule.title || 'A great haircut every time, on your schedule'}
                  </h3>
                  <p className="text-lg text-white opacity-90 mb-6">
                    {schedule.description || 'Get the look you love with convenient haircuts that fit into your busy life.'}
                  </p>
                  <Link href="/map">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                      {schedule.buttonText || 'Find a Salon'}
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-gray-900 mb-8">
                {news.title || 'Great news'}
              </h3>

              <div className="space-y-6">
                {news.articles && news.articles.length > 0 ? (
                  news.articles.map((article, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <h4 className="text-xl font-semibold text-gray-900 mb-3">
                        {article.title}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        {article.description}
                      </p>
                      <button className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                        {article.buttonText || 'Read more'}
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    {[
                      { title: 'Taper, fade, or undercut?', desc: 'We\'re breaking down these hairstyles so you can find out which one suits you best.', btn: 'Read more' },
                      { title: 'Find your next great cut', desc: 'From layers to fades, our lookbook is here to inspire what\'s next for your hair.', btn: 'Browse haircuts' },
                      { title: 'Work greatly', desc: 'Grow your career at a salon, whether that\'s as a stylist, manager or receptionist.', btn: 'Learn more' }
                    ].map((article, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <h4 className="text-xl font-semibold text-gray-900 mb-3">
                          {article.title}
                        </h4>
                        <p className="text-gray-600 mb-4">
                          {article.desc}
                        </p>
                        <button className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                          {article.btn}
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

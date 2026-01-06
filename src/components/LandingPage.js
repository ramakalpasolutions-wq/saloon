'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
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
      {/* All your landing page sections here - copy from your current page.js */}
    </>
  );
}

 import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabaseClient';

const QRCodeGenerator = () => {
  const [profile, setProfile] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [menuUrl, setMenuUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [restaurantName, setRestaurantName] = useState(''); // ✅ Added

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setErrorMsg('User not logged in or failed to get user info.');
          return;
        }

        setProfile(user);

        // Base URL for menu page
        const baseUrl = 'https://ar-menu-saas.vercel.app';
        const deployedLink = `${baseUrl}/menu/${user.id}`;
        setMenuUrl(deployedLink);

      } catch (err) {
        console.error('Error fetching profile:', err);
        setErrorMsg('Failed to fetch profile.');
      }
    }
    fetchProfile();
  }, []);

  const generateQR = async () => {
    if (!profile || !menuUrl) {
      setErrorMsg('Profile or menu URL not loaded.');
      return;
    }
    if (!restaurantName.trim()) {
      setErrorMsg('Please enter your restaurant name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Append restaurant name as query param
      const urlWithName = `${menuUrl}?restaurant=${encodeURIComponent(restaurantName)}`;
      const qrDataUrl = await QRCode.toDataURL(urlWithName);
      setQrUrl(qrDataUrl);
    } catch (error) {
      console.error('QR Generation Error:', error);
      setErrorMsg('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = 'menu-qr.png';
    a.click();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        QR Code Generator
      </h2>

      {errorMsg && <p className="mb-4 text-red-600 font-medium text-center">{errorMsg}</p>}

      {/* ✅ Restaurant Name Input */}
      <input
        type="text"
        placeholder="Enter Restaurant Name"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
       className="w-full border p-2 rounded mb-4 text-black bg-white"
       />

      {qrUrl ? (
        <div className="text-center space-y-4">
          <img src={qrUrl} alt="Generated QR Code" className="mx-auto w-48 h-48 rounded-lg shadow-lg" />

          <button
            onClick={downloadQR}
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Download QR Code
          </button>

          <div className="mt-4">
            <p className="text-gray-700 mb-2 font-semibold">Shareable Menu Link:</p>
            <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline break-all">
              {menuUrl}?restaurant={encodeURIComponent(restaurantName)}
            </a>
          </div>

          <div className="flex justify-center space-x-4 mt-4">
            <button onClick={generateQR} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
              Regenerate QR
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={generateQR}
          disabled={loading}
          className="w-full px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading ? 'Generating QR Code...' : 'Generate QR Code'}
        </button>
      )}
    </div>
  );
};

export default QRCodeGenerator;

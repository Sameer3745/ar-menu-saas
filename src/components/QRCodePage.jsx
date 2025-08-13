 import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabaseClient';

const QRCodeGenerator = () => {
  const [profile, setProfile] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [menuUrl, setMenuUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1️⃣ Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setErrorMsg('User not logged in or failed to get user info.');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData) {
          setErrorMsg('Failed to load profile.');
          return;
        }

        setProfile(profileData);

        // ✅ Use deployed URL if exists, fallback to localhost
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173';
        const deployedLink = `${baseUrl}/menu/${profileData.id}`;
        setMenuUrl(deployedLink);

      } catch (err) {
        console.error('Error fetching profile:', err);
        setErrorMsg('Failed to fetch profile.');
      }
    };
    fetchProfile();
  }, []);

  // 2️⃣ Generate QR without storage
  const generateQR = async () => {
    if (!profile || !menuUrl) {
      setErrorMsg('Profile or menu URL not loaded.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const qrDataUrl = await QRCode.toDataURL(menuUrl);
      setQrUrl(qrDataUrl);
    } catch (error) {
      console.error('QR Generation Error:', error);
      setErrorMsg('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Download QR as PNG
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
              {menuUrl}
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

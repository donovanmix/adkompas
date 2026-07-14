import React, { useState } from 'react';

/**
 * AdKompas WhatsApp Lead Capture Widget
 * 
 * Secure CRM-integrated lead capture widget for React / Next.js.
 * Saves lead details in Supabase CRM (via secure Railway API proxy)
 * and redirects user to WhatsApp with a prefilled message.
 * 
 * Props:
 * @param {string} railwayApiUrl - URL of your deployed Railway Proxy server (e.g. "https://api.up.railway.app")
 * @param {string} whatsappNumber - Target WhatsApp number including country code (e.g. "60123456789")
 */
export default function WhatsAppWidget({ 
  railwayApiUrl = 'YOUR_RAILWAY_API_ENDPOINT', 
  whatsappNumber = '60123456789' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [countryCode, setCountryCode] = useState('+60');
  const [phone, setPhone] = useState('');
  const [enquiry, setEnquiry] = useState('');
  const [notification, setNotification] = useState(null);
  
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [enquiryError, setEnquiryError] = useState(false);

  // Country Flags
  const flagUrls = {
    '+60': 'https://flagcdn.com/w40/my.png',
    '+65': 'https://flagcdn.com/w40/sg.png',
    '+62': 'https://flagcdn.com/w40/id.png',
    '+66': 'https://flagcdn.com/w40/th.png',
    '+63': 'https://flagcdn.com/w40/ph.png',
    '+84': 'https://flagcdn.com/w40/vn.png',
    '+1':  'https://flagcdn.com/w40/us.png',
    '+44': 'https://flagcdn.com/w40/gb.png'
  };

  const showNotification = (msg, isErr = false) => {
    setNotification({ message: msg, error: isErr });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleClose = () => {
    setIsOpen(false);
    setNameError(false);
    setPhoneError(false);
    setEnquiryError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNameError(false);
    setPhoneError(false);
    setEnquiryError(false);

    let hasError = false;

    if (!name.trim()) {
      setNameError(true);
      hasError = true;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 5) {
      setPhoneError(true);
      hasError = true;
    }

    if (!enquiry) {
      setEnquiryError(true);
      hasError = true;
    }

    if (hasError) {
      showNotification('Please fill in all required fields.', true);
      // Remove shake indicators after animation completes
      setTimeout(() => {
        setNameError(false);
        setPhoneError(false);
        setEnquiryError(false);
      }, 500);
      return;
    }

    setLoading(true);

    const fullMobile = `${countryCode}${cleanPhone}`;
    const leadData = {
      name: name.trim(),
      company_name: company.trim() || null,
      mobile_number: fullMobile,
      enquiry_subject: enquiry
    };

    let saved = false;

    // Call Railway proxy
    if (railwayApiUrl && railwayApiUrl !== 'YOUR_RAILWAY_API_ENDPOINT') {
      try {
        const response = await fetch(`${railwayApiUrl.replace(/\/$/, '')}/api/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(leadData)
        });

        if (response.ok) {
          saved = true;
        } else {
          const errData = await response.json();
          console.error('API Error:', errData);
          showNotification('CRM Database issue, forwarding to WhatsApp...', true);
        }
      } catch (err) {
        console.error('Connection failure:', err);
        showNotification('Connection offline, forwarding to WhatsApp...', true);
      }
    } else {
      // Demo fallback (if proxy is not yet configured)
      console.log('Demo mode lead save:', leadData);
      await new Promise((resolve) => setTimeout(resolve, 800));
      saved = true;
    }

    setLoading(false);

    if (saved) {
      showNotification('Details logged to CRM! Opening WhatsApp...');
    }

    // Build prefilled message
    let message = `Hi, I am ${name.trim()}`;
    if (company.trim()) {
      message += ` from ${company.trim()}`;
    }
    message += `. I'm enquiring about ${enquiry}.`;

    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;

    setTimeout(() => {
      window.open(waUrl, '_blank');
      handleClose();
      // Reset form fields
      setName('');
      setCompany('');
      setPhone('');
      setEnquiry('');
      setCountryCode('+60');
    }, 500);
  };

  return (
    <>
      {/* SCOPED STYLES TO INJECT INTO THE DOM */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ns-wa-float {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background-color: #25D366;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3), 0 20px 25px -5px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 99999;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .ns-wa-float:hover {
          transform: scale(1.1) rotate(5deg);
          background-color: #1ebd54;
          box-shadow: 0 6px 16px rgba(37, 211, 102, 0.4), 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        .ns-wa-float svg {
          width: 32px;
          height: 32px;
          fill: #fff;
        }
        .ns-wa-float::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          border: 2px solid #25D366;
          animation: ns-pulse-glow 2s infinite;
          opacity: 0.6;
        }
        @keyframes ns-pulse-glow {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .ns-modal-backdrop {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background-color: rgba(9, 13, 22, 0.7);
          backdrop-filter: blur(12px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          padding: 20px;
        }
        .ns-modal-backdrop.active {
          opacity: 1;
          pointer-events: auto;
        }
        .ns-modal-container {
          background-color: #ffffff;
          width: 100%;
          max-width: 480px;
          border-radius: 28px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          overflow: hidden;
          transform: scale(0.9) translateY(40px);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
          border: 1px solid rgba(255, 255, 255, 0.8);
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          color: #090d16;
          text-align: left;
        }
        .ns-modal-backdrop.active .ns-modal-container {
          transform: scale(1) translateY(0);
          opacity: 1;
        }

        .ns-modal-close-btn {
          position: absolute;
          top: 24px; right: 24px;
          width: 32px; height: 32px;
          border-radius: 50%;
          background-color: #f1f5f9;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
        }
        .ns-modal-close-btn:hover {
          background-color: #e2e8f0;
          color: #090d16;
        }

        .ns-modal-header {
          padding: 40px 32px 24px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .ns-wa-logo-wrapper {
          width: 64px; height: 64px;
          background-color: #25D366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 8px 16px rgba(37, 211, 102, 0.2);
        }
        .ns-wa-logo-wrapper svg {
          width: 36px; height: 36px;
          fill: #fff;
        }
        .ns-modal-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #090d16;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        .ns-modal-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.5;
          max-width: 320px;
          margin: 0;
        }

        .ns-modal-form {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .ns-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ns-form-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #475569;
          letter-spacing: 0.06em;
        }
        .ns-form-input, .ns-form-select {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
          background-color: #fff;
          font-size: 0.95rem;
          color: #090d16;
          transition: all 0.2s ease;
          outline: none;
          height: auto;
        }
        .ns-form-input:focus, .ns-form-select:focus {
          border-color: #FF4D1C;
          box-shadow: 0 0 0 4px rgba(255, 77, 28, 0.1);
        }

        .ns-mobile-input-wrapper {
          display: flex;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          background-color: #fff;
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .ns-mobile-input-wrapper:focus-within {
          border-color: #FF4D1C;
          box-shadow: 0 0 0 4px rgba(255, 77, 28, 0.1);
        }
        .ns-country-select-container {
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 12px;
          background-color: #f8fafc;
          border-right: 1.5px solid #cbd5e1;
        }
        .ns-country-flag-icon {
          width: 20px;
          margin-right: 6px;
          border-radius: 2px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .ns-country-select {
          border: none;
          background: transparent;
          font-size: 0.95rem;
          font-weight: 600;
          color: #090d16;
          cursor: pointer;
          outline: none;
          padding-right: 12px;
          appearance: none;
        }
        .ns-country-select-container::after {
          content: '▼';
          font-size: 8px;
          color: #64748b;
          position: absolute;
          right: 12px;
          pointer-events: none;
        }
        .ns-phone-input {
          flex: 1;
          border: none;
          padding: 14px 16px;
          font-size: 0.95rem;
          color: #090d16;
          outline: none;
          background: transparent;
        }

        .ns-btn-submit {
          width: 100%;
          background-color: #FF4D1C;
          color: #fff;
          border: none;
          padding: 16px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 77, 28, 0.2);
          transition: all 0.2s ease;
          margin-top: 10px;
        }
        .ns-btn-submit:hover {
          background-color: #e03b0d;
          box-shadow: 0 6px 16px rgba(255, 77, 28, 0.3);
          transform: translateY(-1px);
        }
        .ns-btn-submit svg {
          width: 20px; height: 20px;
          fill: #fff;
        }
        .ns-spinner {
          width: 20px; height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: ns-spin 1s ease-in-out infinite;
          display: none;
        }
        @keyframes ns-spin { to { transform: rotate(360deg); } }

        .ns-btn-submit.loading .ns-spinner { display: inline-block; }
        .ns-btn-submit.loading .ns-btn-text, .ns-btn-submit.loading svg { display: none; }

        @keyframes ns-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .ns-shake-error {
          animation: ns-shake 0.3s ease;
          border-color: #ef4444 !important;
        }

        /* Toast Container */
        .ns-toast-container {
          position: fixed;
          top: 20px; left: 50%;
          transform: translateX(-50%);
          z-index: 1100000;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ns-toast {
          background-color: #090d16;
          color: #fff;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.3s ease;
          border-left: 4px solid #FF4D1C;
        }
        .ns-toast.show {
          opacity: 1;
          transform: translateY(0);
        }
        .ns-toast-error {
          border-left-color: #ef4444;
        }
      `}} />

      {/* FLOATING WHATSAPP BUTTON */}
      <div 
        className="ns-wa-float" 
        onClick={() => setIsOpen(true)}
        title="Chat with AdKompas on WhatsApp"
      >
        <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </div>

      {/* POPUP MODAL BACKDROP */}
      <div className={`ns-modal-backdrop ${isOpen ? 'active' : ''}`} onClick={(e) => e.target.classList.contains('ns-modal-backdrop') && handleClose()}>
        
        {/* MODAL CONTAINER */}
        <div className="ns-modal-container">
          
          {/* Close button */}
          <button className="ns-modal-close-btn" onClick={handleClose} aria-label="Close modal">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          {/* Header */}
          <div className="ns-modal-header">
            <div className="ns-wa-logo-wrapper">
              <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
            </div>
            <h2 className="ns-modal-title">One Quick Step</h2>
            <p className="ns-modal-subtitle">Share your details and our team will WhatsApp you right away.</p>
          </div>

          {/* Form */}
          <form className="ns-modal-form" onSubmit={handleSubmit} noValidate>
            
            {/* Name */}
            <div className="ns-form-group">
              <label className="ns-form-label" htmlFor="ns-name-input">Your Name</label>
              <input 
                className={`ns-form-input ${nameError ? 'ns-shake-error' : ''}`}
                type="text" 
                id="ns-name-input"
                placeholder="e.g. Jason" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>

            {/* Company */}
            <div className="ns-form-group">
              <label className="ns-form-label" htmlFor="ns-company-input">Company Name <span style={{fontWeight: 'normal', opacity: 0.6}}>(optional)</span></label>
              <input 
                className="ns-form-input" 
                type="text" 
                id="ns-company-input"
                placeholder="e.g. ABC Sdn Bhd" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {/* Mobile Number */}
            <div className="ns-form-group">
              <label className="ns-form-label" htmlFor="ns-phone-input">Mobile Number</label>
              <div className={`ns-mobile-input-wrapper ${phoneError ? 'ns-shake-error' : ''}`}>
                <div className="ns-country-select-container">
                  <img className="ns-country-flag-icon" src={flagUrls[countryCode]} alt="Country Flag" />
                  <select 
                    className="ns-country-select" 
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+60">+60</option>
                    <option value="+65">+65</option>
                    <option value="+62">+62</option>
                    <option value="+66">+66</option>
                    <option value="+63">+63</option>
                    <option value="+84">+84</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                </div>
                <input 
                  className="ns-phone-input" 
                  type="tel" 
                  id="ns-phone-input"
                  placeholder="12-345 6789" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required 
                />
              </div>
            </div>

            {/* Enquiry Dropdown */}
            <div className="ns-form-group">
              <label className="ns-form-label" htmlFor="ns-enquiry-input">I'm Enquiring About</label>
              <select 
                className={`ns-form-select ${enquiryError ? 'ns-shake-error' : ''}`}
                id="ns-enquiry-input"
                value={enquiry}
                onChange={(e) => setEnquiry(e.target.value)}
                required
              >
                <option value="" disabled>— Select a service —</option>
                <option value="Reddit Community Seeding">Reddit Community Seeding</option>
                <option value="Wikipedia Presence Support">Wikipedia Presence Support</option>
                <option value="Industry Content Placement">Industry Content Placement</option>
                <option value="Digital PR & Publishing">Digital PR & Publishing</option>
                <option value="Citation Intelligence Audits">Citation Intelligence Audits</option>
                <option value="General Enquiry">General Enquiry</option>
              </select>
            </div>

            {/* Submit Button */}
            <button 
              className={`ns-btn-submit ${loading ? 'loading' : ''}`} 
              type="submit" 
              disabled={loading}
            >
              <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
              <span className="ns-btn-text">Continue to WhatsApp</span>
              <span className="ns-spinner"></span>
            </button>

          </form>
        </div>
      </div>

      {/* TOAST SYSTEM */}
      {notification && (
        <div className="ns-toast-container">
          <div className={`ns-toast show ${notification.error ? 'ns-toast-error' : ''}`}>
            {notification.message}
          </div>
        </div>
      )}
    </>
  );
}

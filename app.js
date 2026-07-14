// WhatsApp CRM Pop-up Logic and Traffic Source Attribution
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const floatBtn = document.getElementById('whatsapp-float-btn');
  const backdrop = document.getElementById('whatsapp-backdrop');
  const modalContainer = document.getElementById('whatsapp-modal');
  const closeBtn = document.getElementById('whatsapp-close-btn');
  const form = document.getElementById('whatsapp-crm-form');
  const submitBtn = document.getElementById('whatsapp-submit-btn');
  const enquirySelect = document.getElementById('enquiry-subject');
  const countrySelect = document.getElementById('country-code');
  const countryFlag = document.getElementById('country-flag');
  const mobileInput = document.getElementById('mobile-number');
  const nameInput = document.getElementById('customer-name');
  const emailInput = document.getElementById('customer-email');
  const companyInput = document.getElementById('company-name');
  const messageInput = document.getElementById('customer-message');

  // Country flags map
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

  // 1. Traffic Source & Channel Tracking Logic
  function getQueryParam(name) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name) || '';
    } catch (e) {
      return '';
    }
  }

  function detectTrafficChannel() {
    const referrer = document.referrer || '';
    const currentHost = window.location.hostname;
    
    // Check url search parameters first (Paid Ads)
    if (getQueryParam('gclid') || getQueryParam('gbraid') || getQueryParam('wbraid') || getQueryParam('gad_source')) {
      return 'Google Ads';
    }
    if (getQueryParam('fbclid')) {
      return 'Facebook Ads';
    }
    if (getQueryParam('ttclid')) {
      return 'TikTok Ads';
    }
    if (getQueryParam('msclkid')) {
      return 'Bing Ads';
    }
    if (getQueryParam('utm_source') === 'linkedin' || getQueryParam('utm_medium') === 'social') {
      return 'LinkedIn';
    }
    
    const utmMedium = getQueryParam('utm_medium').toLowerCase();
    if (utmMedium === 'email') {
      return 'Email';
    }
    if (utmMedium === 'cpc' || utmMedium === 'paid') {
      return 'Paid Search';
    }

    // Check organic search engines via referrer
    if (referrer) {
      try {
        const refUrl = new URL(referrer);
        const refHost = refUrl.hostname.toLowerCase();
        
        if (refHost.includes('google.') || refHost.includes('bing.com') || refHost.includes('yahoo.com') || refHost.includes('duckduckgo.com')) {
          return 'Organic';
        }
        
        // If it's another domain entirely
        if (!refHost.includes(currentHost)) {
          return 'Referral';
        }
      } catch (e) {
        // Fallback if URL parsing fails
      }
    }

    // Default to Direct
    return 'Direct';
  }

  // Load or track channel attribution on page landing and persist it in sessionStorage
  let attribution = {
    channel: 'Direct',
    fromPage: window.location.href,
    referrer: document.referrer || ''
  };

  try {
    const storedAttr = sessionStorage.getItem('adkompas_attribution');
    if (storedAttr) {
      attribution = JSON.parse(storedAttr);
    } else {
      attribution.channel = detectTrafficChannel();
      sessionStorage.setItem('adkompas_attribution', JSON.stringify(attribution));
    }
  } catch (e) {
    console.error('Session storage error:', e);
  }

  console.log('Attribution Tracked:', attribution);

  // 2. Dropdown dynamic population
  if (typeof CONFIG !== 'undefined' && CONFIG.enquiryOptions && enquirySelect) {
    enquirySelect.innerHTML = '<option value="" disabled selected>— Select a service —</option>';
    CONFIG.enquiryOptions.forEach(option => {
      const optEl = document.createElement('option');
      optEl.value = option;
      optEl.textContent = option;
      enquirySelect.appendChild(optEl);
    });
  }

  // 3. Country flag toggles
  if (countrySelect && countryFlag) {
    countrySelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (flagUrls[val]) {
        countryFlag.src = flagUrls[val];
      }
    });
  }

  // 4. Modal Dialog Controls
  function openModal(e) {
    if (e) e.preventDefault();
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    resetErrors();
  }

  function resetErrors() {
    const fields = [nameInput, emailInput, enquirySelect];
    fields.forEach(f => f && f.classList.remove('shake-error'));
    if (mobileInput) mobileInput.parentElement.classList.remove('shake-error');
  }

  if (floatBtn) floatBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  // Intercept all strategy call links (any tag with class 'cta-button-wa' or typeform link wrapper)
  document.querySelectorAll('.cta-button-wa').forEach(el => {
    el.addEventListener('click', openModal);
  });

  // Handle CTA buttons in header/hero that don't have the class yet (safety fallback)
  document.querySelectorAll('a[href*="typeform.com"]').forEach(el => {
    el.removeAttribute('target');
    el.setAttribute('href', '#');
    el.addEventListener('click', openModal);
  });

  // Toast Alerts
  function showToastNotification(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // 5. Submit validation and backend proxying
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      resetErrors();

      const name = nameInput.value.trim();
      const company = companyInput.value.trim();
      const email = emailInput.value.trim();
      const countryCode = countrySelect.value;
      const phoneRaw = mobileInput.value.trim();
      const enquiry = enquirySelect.value;
      const messageText = messageInput.value.trim();

      // Form validation
      let hasError = false;
      if (!name) {
        nameInput.classList.add('shake-error');
        hasError = true;
      }
      if (!email || !email.includes('@')) {
        emailInput.classList.add('shake-error');
        hasError = true;
      }
      const cleanPhone = phoneRaw.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 5) {
        mobileInput.parentElement.classList.add('shake-error');
        hasError = true;
      }
      if (!enquiry) {
        enquirySelect.classList.add('shake-error');
        hasError = true;
      }

      if (hasError) {
        showToastNotification('Please correct the highlighted fields.', 'error');
        setTimeout(resetErrors, 500);
        return;
      }

      const fullMobileNumber = `${countryCode}${cleanPhone}`;

      // Loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      const leadPayload = {
        name: name,
        company_name: company || null,
        email: email,
        mobile_number: fullMobileNumber,
        enquiry_subject: enquiry,
        message: messageText || null,
        channel: attribution.channel,
        from_page: attribution.fromPage
      };

      let dbSaved = false;

      // Submit to Railway API Endpoint
      if (typeof CONFIG !== 'undefined' && CONFIG.railwayApiUrl && !CONFIG.railwayApiUrl.includes('your-adkompas-api')) {
        try {
          const response = await fetch(`${CONFIG.railwayApiUrl.replace(/\/$/, '')}/api/leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadPayload)
          });

          if (response.ok) {
            dbSaved = true;
          } else {
            const errData = await response.json();
            console.error('Railway API Error:', errData);
            showToastNotification('CRM database issue. Connecting to WhatsApp...', 'error');
          }
        } catch (err) {
          console.error('Railway Connection Error:', err);
          showToastNotification('CRM Connection failed. Connecting to WhatsApp...', 'error');
        }
      } else {
        // Local/Demo mock delay
        await new Promise(r => setTimeout(r, 800));
        console.log('Demo Submit Payload (config.js endpoint not set):', leadPayload);
        dbSaved = true;
      }

      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;

      if (dbSaved) {
        showToastNotification('Lead captured! Redirecting...');
      }

      // 6. Trigger Google Ads Conversion Tracking
      if (typeof CONFIG !== 'undefined' && CONFIG.googleAdsConversionId) {
        // Fire gtag event
        if (typeof window.gtag === 'function') {
          console.log('Firing Google Ads conversion:', CONFIG.googleAdsConversionId);
          window.gtag('event', 'conversion', {
            'send_to': CONFIG.googleAdsConversionId
          });
        } else {
          console.log('Google Ads Conversion Event simulated (gtag.js not loaded on page).');
        }
      }

      // 7. Format WhatsApp redirect link and open chat
      let waMessage = `Hi, I am ${name}`;
      if (company) waMessage += ` from ${company}`;
      waMessage += `. I'm interested in "${enquiry}".`;
      if (messageText) waMessage += ` Message: ${messageText}`;

      const targetWhatsapp = (typeof CONFIG !== 'undefined' && CONFIG.whatsappNumber)
        ? CONFIG.whatsappNumber
        : '60123456789';

      const encodedMsg = encodeURIComponent(waMessage);
      const whatsappUrl = `https://wa.me/${targetWhatsapp}?text=${encodedMsg}`;

      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        closeModal();
        form.reset();
        if (countrySelect && countryFlag) {
          countrySelect.value = '+60';
          countryFlag.src = flagUrls['+60'];
        }
      }, 500);
    });
  }
});

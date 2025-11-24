const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

/**
 * Send a confirmation email using EmailJS REST API.
 * Expects env vars:
 *  - VITE_EMAILJS_SERVICE_ID
 *  - VITE_EMAILJS_TEMPLATE_ID
 *  - VITE_EMAILJS_PUBLIC_KEY
 */
export const sendConfirmationEmail = async ({ toEmail, formTitle, answersText, respondentName }) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS env vars missing, skipping confirmation email.');
    return false;
  }

  if (!toEmail || !toEmail.trim()) {
    throw new Error('Missing recipient email');
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: toEmail.trim(),
      user_email: toEmail.trim(),
      reply_to: toEmail.trim(),
      email: toEmail.trim(),
      form_title: formTitle,
      name: respondentName || '',
      title: formTitle,
      answers: answersText
    }
  };

  const res = await fetch(EMAILJS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Email send failed: ${res.status} ${text}`);
  }

  return true;
};

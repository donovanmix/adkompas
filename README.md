# AdKompas WhatsApp Lead Capture Widget

A secure CRM lead capture widget designed for **AdKompas** (https://www.adkompas.com/). When clicked, a popup modal allows users to share their details before opening a chat on WhatsApp. Visitor details are securely recorded in your Supabase CRM database.

Since AdKompas is built using **Next.js**, we have provided both a **Next.js React Component** and a **Standalone HTML Snippet**.

---

## 🚀 How to Implement

### 1. Database Setup (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com/).
2. Run the SQL commands in [supabase_setup.sql](supabase_setup.sql) in the **SQL Editor** to create the `whatsapp_leads` table and configure access permissions.

### 2. Secure Backend Proxy (Railway)
1. Deploy the contents of the `server/` directory to **Railway** (linked to a private GitHub repo).
2. Configure the following environment variables in your Railway settings:
   - `SUPABASE_URL` = (Your Supabase Project URL)
   - `SUPABASE_KEY` = (Your Supabase secret `service_role` key)
3. Note your Railway public URL (e.g. `https://your-adkompas-api.up.railway.app`).

### 3. Website Integration

#### Option A: Next.js Component (Recommended)
Import the provided [WhatsAppWidget.jsx](WhatsAppWidget.jsx) component directly into your Next.js layout:

```jsx
import WhatsAppWidget from './WhatsAppWidget';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* AdKompas Secure WhatsApp Widget */}
        <WhatsAppWidget 
          railwayApiUrl="https://your-adkompas-api.up.railway.app" 
          whatsappNumber="60123456789" 
        />
      </body>
    </html>
  );
}
```

#### Option B: Standalone HTML Snippet
If you are inserting code directly into a static landing page or custom block builder:
1. Copy the code in [whatsapp_widget_snippet.html](whatsapp_widget_snippet.html).
2. Paste it right before the closing `</body>` tag of your page.
3. Update the `CONFIG` block at the bottom of the script with your details:
   ```javascript
   const CONFIG = {
     railwayApiUrl: 'https://your-adkompas-api.up.railway.app',
     whatsappNumber: '60123456789'
   };
   ```

---

## 📂 Codebase Inventory

* [WhatsAppWidget.jsx](WhatsAppWidget.jsx) - Scoped React / Next.js component.
* [whatsapp_widget_snippet.html](whatsapp_widget_snippet.html) - Portable HTML/CSS/JS snippet.
* [supabase_setup.sql](supabase_setup.sql) - Database initialization script.
* [server/](server/) - Backend proxy server codebase.

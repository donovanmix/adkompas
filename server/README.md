# WhatsApp CRM Proxy Server (Railway)

This is a lightweight Node.js Express server that acts as a secure intermediary between your WordPress front-end and your Supabase database. It prevents your private database keys from being exposed on the public web.

## Quick Start on Railway

1. **Deploy to Railway**:
   - Push this `server/` directory contents to a private repository on GitHub.
   - Go to your Railway dashboard and click **New Project** > **Deploy from GitHub repo**.
   - Select your newly created repository.

2. **Configure Environment Variables**:
   In your Railway project settings, add the following variables under the **Variables** tab:
   - `SUPABASE_URL` = (Your Supabase Project URL)
   - `SUPABASE_KEY` = (Your Supabase Secret `service_role` API key)

3. **Verify Deployment**:
   Railway will automatically provision a public domain for your service (e.g., `https://your-api.up.railway.app`). Visit that URL in a browser; it should return:
   ```json
   { "status": "healthy", "message": "WhatsApp CRM Proxy API is running." }
   ```

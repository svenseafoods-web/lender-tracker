// Google Client ID from environment variable
// In Vercel, set VITE_GOOGLE_CLIENT_ID in the dashboard
// For local development, create a .env file with: VITE_GOOGLE_CLIENT_ID=your-client-id
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "218160360296-qv4u37j12e3bmjdc1qajpi6v4j8r0qpj.apps.googleusercontent.com";

// Allowed emails from environment variable (comma-separated)
// In Vercel, set VITE_ALLOWED_EMAILS=email1@gmail.com,email2@gmail.com
// For local development, create a .env file with: VITE_ALLOWED_EMAILS=your-email@gmail.com
const allowedEmailsEnv = import.meta.env.VITE_ALLOWED_EMAILS || "svenseafoods@gmail.com";
export const ALLOWED_EMAILS = allowedEmailsEnv.split(',').map(email => email.trim());

// Scopes required for Google Drive access and user info
export const SCOPES = "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

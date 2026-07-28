# Firebase Authentication & Setup Guide

SupportFlow uses **Firebase Authentication** for user authentication (Email & Password + Google OAuth) and **Firebase Cloud Messaging (FCM)** for browser push notifications.

---

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project**, name your project (e.g. `supportflow-app`), and click **Continue**.
3. (Optional) Disable Google Analytics or keep defaults, then click **Create Project**.

---

## 2. Enable Authentication Providers

1. In the left navigation bar of your Firebase console, click **Build** -> **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - **Email/Password**: Click Email/Password -> Enable -> Save.
   - **Google**: Click Google -> Enable -> Choose Support Email -> Save.

---

## 3. Configure Web App Keys for Frontend (`/frontend/.env`)

1. In project overview, click the **Web icon (`</>`)** to add a web application.
2. Enter app nickname `SupportFlow Web` and click **Register app**.
3. Copy the `firebaseConfig` keys provided in the console snippet.
4. Paste them into your `frontend/.env` file:

```env
VITE_API_URL="http://localhost:5000/api/v1"
VITE_FIREBASE_API_KEY="AIzaSyYourActualApiKeyHere..."
VITE_FIREBASE_AUTH_DOMAIN="supportflow-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="supportflow-app"
VITE_FIREBASE_STORAGE_BUCKET="supportflow-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
```

---

## 4. Configure Service Account Private Key for Backend (`/backend/.env`)

1. In Firebase Console, click the gear icon ⚙️ next to **Project Overview** -> **Project Settings**.
2. Go to the **Service Accounts** tab.
3. Click **Generate new private key** -> Confirm download of the `.json` key file.
4. Open the downloaded `.json` file and copy the values into your `backend/.env` file:

```env
FIREBASE_PROJECT_ID="supportflow-app"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@supportflow-app.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----\n"
```

---

## 5. Testing Login & Role Sync Flow

1. Open `http://localhost:5173`.
2. Click **Create Account**.
3. Select **Business Owner** or **Customer**.
4. Register with Email/Password or click **Continue with Google**.
5. SupportFlow will authenticate with Firebase SDK, retrieve the ID Token, sync the user to your PostgreSQL database, and direct you to the appropriate role dashboard!

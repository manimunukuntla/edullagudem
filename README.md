# ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026 Lucky Draw Portal
### (Edullagudem Devi Sharannavarathulu 2026 Lucky Draw)

Official full-stack web application for the **Edullagudem Devi Sharannavarathulu 2026 Lucky Draw**. Built with a mobile-first, temple-aesthetic UI (Saffron, Crimson Red, Gold), full Telugu ↔ English language toggle, instant UPI QR payment flow (₹50), automated sequential token generation starting from #1, Google Sheets API synchronization, and direct WhatsApp notification integration targeting **6305729387**.

---

## 📑 Project Structure

```text
├── .env.example              # Environment variables template
├── index.html                # Entry point with Telugu & display Google fonts
├── metadata.json             # AI Studio app metadata
├── package.json              # Node dependencies & full-stack scripts
├── server.ts                 # Full-stack Express server with Vite middleware
├── server/
│   ├── db.ts                 # Persistent database with sequential token allocator
│   └── googleSheets.ts       # Google Sheets API v4 integration & sync service
├── src/
│   ├── App.tsx               # Main SPA orchestrator (Home, Register, Lookup, Admin)
│   ├── index.css             # Tailwind CSS imports & theme styling
│   ├── main.tsx              # React DOM mounting
│   ├── types.ts              # TypeScript interfaces (Entry, Language, etc.)
│   ├── lib/
│   │   ├── translations.ts   # Bilingual Telugu ↔ English dictionary
│   │   └── whatsapp.ts       # WhatsApp formatter & link builder for 6305729387
│   └── components/
│       ├── Header.tsx        # Top navigation with Language Toggle (Telugu ↔ English)
│       ├── TempleHero.tsx    # Auspicious temple hero banner with event date & ₹50 fee
│       ├── RegistrationForm.tsx # Devotee registration (Name, 10-digit Indian Mobile, Address)
│       ├── PaymentModal.tsx  # Dynamic QR for KANDALA KIRAN REDDY (9573454579@postbank)
│       ├── SuccessView.tsx   # Success confirmation screen with celebratory confetti
│       ├── TokenLookup.tsx   # Mobile number token search & status checker
│       ├── AdminPanel.tsx    # Password-protected admin dashboard (Pending-first, Approval)
│       ├── EventDetails.tsx  # Grand prizes showcase & village festival schedule
│       ├── FestiveIcons.tsx  # Auspicious Diya, Kalasam, and Temple SVG motifs
│       └── Footer.tsx        # Quiet traditional footer with committee contact info
├── data/
│   └── entries.json          # Persistent local storage backup
└── README.md                 # Complete setup & deployment documentation
```

---

## 🚀 Key Features

1. **Mobile-First Temple Aesthetic**:
   - Auspicious colors: Deep crimson red (`#881337`), golden saffron (`#EA580C`, `#F59E0B`), warm ivory background (`#FFF9F2`).
   - Authentic SVG diya oil lamps, kalasam with mango leaves & sacred coconut, and temple arch motifs.
   - Elegant typography pairing **Noto Sans Telugu** for authentic Telugu script and **Cinzel** for monumental English headings.

2. **Full Bilingual Support (Telugu ↔ English)**:
   - Instant 1-click toggle switches every headline, form label, error message, and note.

3. **Devotee Registration & Validation**:
   - Name (Required)
   - Mobile Number (Required, strictly validated for 10-digit Indian numbers starting with 6–9)
   - Address / Village (Optional)

4. **Interactive UPI QR Payment**:
   - Generates the exact UPI QR code for: `KANDALA KIRAN REDDY – 9573454579@postbank`
   - Explicitly displays: **Pay ₹50**
   - Clickable **"I have completed the payment of ₹50"** button.
   - Shows: *"Thank you! Your entry is submitted. Token will be sent after payment verification."* / *"ధన్యవాదాలు! మీ ఎంట్రీ సమర్పించబడింది. చెల్లింపు ధృవీకరణ తర్వాత టోకెన్ నంబర్ పంపబడుతుంది."*

5. **Google Sheets API Integration**:
   - **Sheet ID**: `1AiIcdMBMOu5BVLf3Tvhekn5K4etuXrOgrMjmc_MicSw`
   - Columns:
     - `A: Token No` (starts at 1, strictly sequential, assigned on approval)
     - `B: Name`
     - `C: Phone`
     - `D: Address`
     - `E: Status` (`Pending` / `Paid`)
     - `F: Submitted At`
     - `G: Approved At`
     - `H: Notes`
   - Dual-layer reliability: When Google Service Account credentials are provided, updates sync straight to Google Sheet. Even before credentials are added, the app runs flawlessly using persistent local storage!

5. **Admin Dashboard (Password Protected)**:
   - Password configured via `ADMIN_PASSWORD` env var (Default: `edu@123`).
   - Displays all entries with **Pending ones first**.
   - One-click green **"Approve & Generate Token"** button.
   - Assigns next sequential Token No starting from 1 (never resets or skips).
   - Generates exact WhatsApp message directed **ONLY to 6305729387**:
     ```text
     ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026 Lucky Draw Token

     Token No: {number}
     Name: {name}
     Phone: {phone}
     Address: {address or "Not provided"}
     Amount Paid: ₹50
     Lucky Draw Opening Date: 21 October 2026

     Please forward this Token message to the user.
     ```
   - One-click **"Open WhatsApp (6305729387)"** button launches WhatsApp Web/App directly with the pre-filled text.

6. **Real-Time WhatsApp Delivery Receipts & Tracking**:
   - Live delivery status for every approved entry:
     - ⚪ `Not Dispatched`
     - ⏳ `Queued` (actively waiting for network dispatch)
     - ↗ `Sent (✓)` (dispatched to carrier gateway, single checkmark)
     - ✓✓ `Delivered (✓✓)` (successfully landed on devotee handset, double checkmarks)
     - 👁 `Read (✓✓)` (opened & read by devotee, blue double checkmarks)
     - ❌ `Failed` (alert badge showing failure reason, e.g. "Number not on WhatsApp" with one-click **Retry Delivery** button)
   - Real-time Server-Sent Events (SSE) updates: Whenever a delivery receipt webhook arrives or a status transitions, the admin dashboard updates instantaneously without needing page refreshes.
   - Meta WhatsApp Business Cloud API & Webhook endpoint: `/api/webhook/whatsapp`.

7. **Token Status Lookup**:
   - Devotees can enter their registered 10-digit mobile number anytime to see their allocated token number or verification status.

---

## 🔑 Environment Variables Setup

Create a `.env` file in the root directory (refer to `.env.example`):

```bash
# Admin Panel Password (edu@123)
ADMIN_PASSWORD="edu@123"

# Google Sheet Details
GOOGLE_SHEET_ID="1AiIcdMBMOu5BVLf3Tvhekn5K4etuXrOgrMjmc_MicSw"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# WhatsApp Admin Number & Meta Cloud API Configuration
WHATSAPP_ADMIN_NUMBER="6305729387"
WHATSAPP_API_TOKEN="EAA..."
WHATSAPP_PHONE_NUMBER_ID="10..."
WHATSAPP_VERIFY_TOKEN="edullagudem_devi_token"

# UPI Receiver Details
UPI_ID="9573454579@postbank"
UPI_NAME="KANDALA KIRAN REDDY"
TICKET_AMOUNT="50"
```

---

## 📊 Google Sheets API Setup (Step-by-Step)

Follow these simple steps to link the Google Sheet:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Click **Create Project** (e.g., `Edullagudem-Lucky-Draw`).

2. **Enable Google Sheets API**:
   - Navigate to **APIs & Services** > **Library**.
   - Search for **Google Sheets API** and click **Enable**.

3. **Create Service Account**:
   - Go to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **Service Account**.
   - Name it (e.g., `lucky-draw-writer`).
   - Click **Create and Continue**, then click **Done**.

4. **Generate Private Key JSON**:
   - Click on the created service account email.
   - Go to the **Keys** tab > **Add Key** > **Create New Key** > Select **JSON** > Click **Create**.
   - A `.json` key file will download to your computer.

5. **Share the Google Sheet with the Service Account**:
   - Open your Google Sheet: `https://docs.google.com/spreadsheets/d/1AiIcdMBMOu5BVLf3Tvhekn5K4etuXrOgrMjmc_MicSw/edit`
   - Click the **Share** button in the top right.
   - Paste the service account email (e.g. `lucky-draw-writer@...iam.gserviceaccount.com`).
   - Choose role **Editor** and uncheck "Notify people", then click **Share**.

6. **Set Environment Variables**:
   - From your downloaded JSON key:
     - Copy `client_email` into `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
     - Copy `private_key` into `GOOGLE_PRIVATE_KEY`.

---

## 🌐 Deploying to Vercel (Free Tier)

This application can be deployed instantly to Vercel:

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Edullagudem Devi Lucky Draw"
   git branch -M main
   git remote add origin https://github.com/your-username/edullagudem-lucky-draw.git
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
   - Select your GitHub repository.
   - Under **Environment Variables**, add:
     - `ADMIN_PASSWORD` = `devi2026`
     - `GOOGLE_SHEET_ID` = `1AiIcdMBMOu5BVLf3Tvhekn5K4etuXrOgrMjmc_MicSw`
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `your-service-account@project.iam.gserviceaccount.com`
     - `GOOGLE_PRIVATE_KEY` = your private key string (with line breaks)
     - `WHATSAPP_ADMIN_NUMBER` = `6305729387`
     - `UPI_ID` = `9573454579@postbank`
     - `UPI_NAME` = `KANDALA KIRAN REDDY`
     - `TICKET_AMOUNT` = `50`
   - Click **Deploy**.

---

## 📲 WhatsApp Approval Workflow

When an entry is submitted by a devotee:
1. Devotee scans QR for `9573454579@postbank` (KANDALA KIRAN REDDY) and transfers ₹50.
2. Devotee clicks **"I have completed the payment of ₹50"**.
3. Status is saved as `Pending`.
4. Admin logs into `/admin` using password (`devi2026`).
5. Admin clicks **"Approve & Generate Token"**.
6. The app assigns the next sequential token (e.g., `#1`, `#2`, `#3`... starting from 1).
7. WhatsApp modal opens with the pre-formatted text.
8. Clicking **"Open WhatsApp (6305729387)"** opens a direct WhatsApp conversation with **6305729387** to forward the allocated token to the devotee.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start the full-stack dev server
npm run dev
# Server will start on http://localhost:3000
```

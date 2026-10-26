# 🚀 RoutinePulse - 24/7 Free Cloud Hosting & Multi-User Guide

RoutinePulse is now a **Multi-Tenant Life Automation & WhatsApp Scheduling Engine**.

---

## 🌟 What was Added in this Upgrade:
1. **Multi-User Authentication**:
   - **Registration**: Any user can sign up with their Name, Email, WhatsApp Phone (+91), and Password.
   - **Login & JWT**: Secure session authentication with bcrypt password hashing.
   - **Complete Data Isolation**: Each user gets their own private dashboard, reminders, habits/routines, day planner, and contacts.
   - **Multi-Device WhatsApp Support**: Every user can link their own personal WhatsApp account independently.
2. **24/7 Cloud Ready**:
   - Ready to deploy to **Hugging Face Spaces**, **Render**, **Railway**, or **Koyeb** on **100% Free Tiers**.
   - Public ping endpoint `/api/status` for 24/7 keep-alive uptime monitors.

---

## 🏆 Option 1: Hugging Face Spaces (BEST & EASIEST - 100% Free, Never Sleeps, No Credit Card)

Hugging Face Spaces provides a free **Docker container (2 vCPU, 16 GB RAM, 50 GB storage)** that **never goes to sleep**!

### Step-by-Step 3-Minute Deployment:
1. **Sign Up**:
   - Create a free account at [https://huggingface.co](https://huggingface.co) (no credit card needed).
2. **Create New Space**:
   - Click your profile icon at top right -> Select **"New Space"**.
   - **Space name**: `routinepulse`
   - **License**: `mit`
   - **Space SDK**: Select **Docker** (Blank template).
   - **Space visibility**: Public (or Private).
   - Click **"Create Space"**.
3. **Upload / Push Code**:
   - In your newly created Space, click the **"Files"** tab -> **"Add file"** -> **"Upload files"**.
   - Drag & drop your project folders (`client`, `server`, `Dockerfile`, `.dockerignore`, `package.json`).
   - *OR via Git*:
     ```bash
     git remote add space https://huggingface.co/spaces/YOUR_USERNAME/routinepulse
     git push space main
     ```
4. **Done!**
   - Hugging Face automatically builds the Docker container.
   - In 2 minutes, your app is live 24/7 at:
     ```
     https://YOUR_USERNAME-routinepulse.hf.space
     ```
   - Anyone can open this link from their phone or laptop, create an account, and use RoutinePulse 24/7 even with all their laptops powered off!

---

## 🥈 Option 2: Render.com (100% Free Web Service)

Render offers free web service hosting from GitHub.

1. **Push your code to GitHub**:
   - Create a private or public repository on GitHub and push `c:\Reminder app`.
2. **Create Web Service on Render**:
   - Go to [https://render.com](https://render.com) and sign in with GitHub.
   - Click **"New +"** -> **"Web Service"**.
   - Connect your GitHub repository.
   - Select **Node** environment.
   - **Build Command**:
     ```bash
     npm --prefix client install && npm --prefix client run build && npm --prefix server install
     ```
   - **Start Command**:
     ```bash
     node server/src/index.js
     ```
   - **Plan**: Select **Free**.
   - Click **"Create Web Service"**.
3. **Keep It Awake 24/7 (Prevent Free Sleep)**:
   - Render's free tier sleeps after 15 minutes of inactivity.
   - To make it stay awake 24/7 for free:
     1. Go to [https://cron-job.org](https://cron-job.org) or [https://uptimerobot.com](https://uptimerobot.com) (both 100% free).
     2. Create a new monitor that pings your app every **9 minutes**:
        ```
        https://your-app-name.onrender.com/api/status
        ```
     3. Your Render server will now stay awake 24 hours a day, 7 days a week, continuously dispatching scheduled WhatsApp messages!

---

## 🔑 Default Master Account for Zaid

Your personal account has already been initialized in the system:
* **Email / Username**: `zaid@routinepulse.com` (or your phone `+918767353773`)
* **Default Password**: `zaid123`
* *(You can also simply click the **"Quick Sign In as Zaid"** button on the sign-in page!)*
* Your existing WhatsApp link (`918767353773:35@s.whatsapp.net` - Zaid Chougle) is automatically linked to your account.

Any other person (family, friends, coworkers) who accesses the link can click **"Create Account"**, sign up with their own details, and have their own completely separate automation workspace!

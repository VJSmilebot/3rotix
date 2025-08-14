# 3ROTIX - Creator Platform

> Disrupting Exploitation. By Creators, For Creators.

3ROTIX is a next-generation creator platform that empowers content creators with the tools they need to build their brand and take a stand against exploitation in the digital content space.

## 🚀 Features

- **Video Upload & Streaming**: Powered by Livepeer for decentralized video infrastructure
- **Creator Profiles**: Customizable profiles with social media integration
- **JWT-Gated Content**: Private content accessible only to authorized users
- **Responsive Design**: Mobile-first design built with Tailwind CSS
- **Real-time Authentication**: Secure user management with Supabase
- **Progressive Web App**: Fast, reliable experience across all devices

## 🛠 Tech Stack

- **Frontend**: Next.js 13 with React 18
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Video**: Livepeer Studio for transcoding and streaming
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 16.8 or later
- npm or yarn package manager
- Supabase account and project
- Livepeer Studio account

## ⚡ Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/VJSmilebot/3rotix.git
cd 3rotix
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your actual values in `.env.local`. See [SECURITY.md](./SECURITY.md) for detailed setup instructions.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Set up the database schema (see `docs/database-schema.sql`)
3. Configure Row Level Security policies
4. Add your Supabase credentials to `.env.local`

### Livepeer Setup

1. Sign up for Livepeer Studio
2. Create an API key
3. Add the API key to `.env.local`

## 📁 Project Structure

```
3rotix/
├── components/          # Reusable React components
├── pages/              # Next.js pages and API routes
│   ├── api/           # API endpoints
│   ├── c/             # Creator profile pages
│   └── watch/         # Video viewing pages
├── styles/            # Global styles
├── utils/             # Utility functions
├── public/            # Static assets
└── backups/           # Backup files and features
```

## 🔒 Security

This project implements several security best practices:

- Environment variables are never committed to version control
- All API endpoints include input validation
- Error boundaries prevent application crashes
- Dependencies are regularly audited for vulnerabilities

See [SECURITY.md](./SECURITY.md) for comprehensive security guidelines.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Other Platforms

The application can be deployed on any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📊 Analytics & Monitoring

The platform includes basic error logging and monitoring. For production deployments, consider adding:

- Performance monitoring (Vercel Analytics, Sentry)
- User analytics (Privacy-focused solutions)
- Infrastructure monitoring
- Security scanning

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Community

- **Telegram**: [Join our community](https://t.me/disruptingexploitation)
- **Email**: smilebot3000@gmail.com

## 🗺 Roadmap

- [ ] Advanced creator analytics
- [ ] Live streaming capabilities
- [ ] Mobile app development
- [ ] Creator monetization tools
- [ ] Advanced content moderation
- [ ] Multi-language support

## ⚠️ Known Issues

See [Issues](https://github.com/VJSmilebot/3rotix/issues) for current known issues and feature requests.

---

Built with ❤️ by the 3ROTIX team
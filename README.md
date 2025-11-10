# Campus SkillSwap

A peer-to-peer learning platform for college students where time is currency. Teach skills, earn credits, learn from peers.

## 🚀 Overview

Campus SkillSwap is a platform that enables students to exchange skills using time credits instead of money. Students can teach skills they're proficient in and earn time credits, which they can then spend to learn new skills from other students.

## 🛠️ Implementation

This project uses a Node.js backend with Express and MongoDB:

- **Node.js + Express + MongoDB** - Full-featured implementation with comprehensive API
- Location: `/backend` directory
- Includes features like real-time messaging, robust authentication, and extensive API coverage

**For detailed information about the implementation, see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)**

## 🌐 Frontend

The frontend is built with vanilla HTML, CSS, and JavaScript and can be served using the simple HTTP server in the root directory.

## 🚀 Quick Start

### Running the Recommended Node.js Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5001`

### Running the Frontend

From the root directory:
```bash
node server.js
```

The frontend will be available at `http://localhost:3000`

## 📚 Documentation

- **Node.js Backend**: See `/backend/README.md`
- **Implementation Guide**: See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
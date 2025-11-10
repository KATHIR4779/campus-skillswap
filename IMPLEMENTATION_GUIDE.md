# Campus SkillSwap Implementation Guide

## Overview

This project uses a Node.js implementation of the Campus SkillSwap platform, located in the `/backend` directory.

## Node.js Implementation

The Node.js implementation is the primary version of Campus SkillSwap. It includes:

- More comprehensive feature set
- Better security implementations
- More robust authentication and authorization
- Real-time features with Socket.IO
- Better error handling and validation
- More extensive API documentation
- Better project structure and organization

### Running the Node.js Implementation

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

## Support

For issues with the implementation, please check the README.md file:
- Node.js: `/backend/README.md`
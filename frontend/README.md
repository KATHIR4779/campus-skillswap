# Campus SkillSwap

A peer-to-peer learning platform for college students where time is currency. Teach skills, earn credits, learn from peers.

## 🎯 Project Overview

Campus SkillSwap is designed exclusively for college students in Coimbatore, Tamil Nadu. It enables students to exchange skills using a Time Credits system instead of money, fostering a collaborative learning environment.

## ✨ Features

- **Time Credits System**: Earn credits by teaching, spend credits to learn
- **Skill Marketplace**: Browse and search for skills taught by fellow students
- **User Dashboard**: Manage your skills, sessions, and credits
- **Messaging System**: Communicate with other students
- **Local Focus**: Tailored for Coimbatore students with local skills like Tamil, Kongu cuisine, and Carnatic music
- **University Verification**: Only university email addresses are accepted

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- Local web server (optional, for development)

### Installation

1. Clone or download the project files
2. Open `index.html` in your web browser
3. For development, you can use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

## 📁 Project Structure

```
campus-skillswap/
├── index.html              # Homepage
├── about.html              # About page
├── contact.html            # Contact page
├── dashboard.html          # User dashboard
├── marketplace.html        # Skill marketplace
├── features.html           # Ledger/credits management
├── resources.html          # Alternative marketplace
└── assets/
    ├── css/
    │   └── styles.css      # Main stylesheet
    └── js/
        ├── app.js          # Main JavaScript
        ├── dashboard.js    # Dashboard functionality
        ├── marketplace.js  # Marketplace functionality
        ├── contact.js      # Contact page functionality
        └── ledger.js       # Ledger functionality
```

## 🎨 Pages Overview

### Homepage (`index.html`)
- Hero section with platform introduction
- How it works section
- Features overview
- Popular skills showcase
- Testimonials
- Call-to-action sections

### About (`about.html`)
- Mission and values
- Team information
- Impact statistics
- Detailed how-it-works process

### Contact (`contact.html`)
- Contact form with validation
- FAQ section
- Support resources
- Contact information

### Dashboard (`dashboard.html`)
- User statistics and credits
- Quick actions
- Skills management
- Recent activity
- Upcoming sessions
- Messages

### Marketplace (`marketplace.html`)
- Skill search and filtering
- Detailed skill cards
- Category browsing
- Featured teachers
- Skill detail modals

### Ledger (`features.html`)
- Credits management
- Skills listing
- Transaction history
- Messaging system

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Interactive functionality
- **Font Awesome**: Icons
- **Google Fonts**: Typography (Inter font family)

## 🎯 Key Features Implemented

### Authentication System
- Login/Register modals
- University email validation
- User session management
- Local storage for user data

### Skill Management
- Add/edit/delete skills
- Category-based organization
- Credit pricing system
- Availability settings

### Credits System
- Earn credits by teaching
- Spend credits to learn
- Transaction history
- Real-time balance updates

### Messaging System
- Conversation management
- Real-time messaging interface
- Message history
- User-to-user communication

### Search & Filtering
- Text-based search
- Category filtering
- Rating-based sorting
- Credit-based sorting

## 🎨 Design Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface
- **Accessibility**: Keyboard navigation and ARIA labels
- **Local Branding**: Coimbatore-focused content and imagery
- **Color Scheme**: Professional blue and accent colors

## 🔧 Customization

### Adding New Skills
Skills are defined in the JavaScript files with mock data. To add new skills:

1. Edit `assets/js/marketplace.js`
2. Add new skill objects to the `getMockSkills()` function
3. Include all required fields: id, title, teacher, rating, credits, description, category, tags

### Styling Changes
All styles are centralized in `assets/css/styles.css`. The file uses CSS custom properties (variables) for easy theming.

### Adding New Pages
1. Create HTML file following existing structure
2. Add navigation links in all pages
3. Create corresponding JavaScript file if needed
4. Update `app.js` to initialize page-specific functionality

## 🚀 Future Enhancements

- Backend API integration
- Real user authentication
- Payment system integration
- Mobile app development
- Advanced search algorithms
- Video call integration
- Skill certification system

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

This is a demo project showcasing a peer-to-peer learning platform concept. Feel free to use it as inspiration for your own projects!

## 📄 License

This project is for demonstration purposes. Feel free to use and modify as needed.

## 📞 Contact

For questions about this project, please refer to the contact information in the application.

---

**Campus SkillSwap** - Empowering students to learn and teach through peer-to-peer skill exchange.

# DVP (Design Visualization Platform)

## 📌 Overview
DVP (Design Visualization Platform) is an interactive web-based tool that allows users to visualize, customize, and arrange furniture, room decor, and kitchen items in a digital environment. The platform provides a user-friendly interface to experiment with different layouts, and arrangements before implementing them in real spaces.

## 🚀 Features
- **Interactive Design Canvas**: Drag-and-drop functionality for furniture and decor items
- **Real-time Customization**: Live color and layout modifications
- **2D Visualization**: Interactive visualization using Konva.js
- **Smart Suggestions**: Room color-based furniture recommendations
- **User Management**: Custom user authentication and profiles
- **Admin Dashboard**: Comprehensive admin panel for managing products and users
- **Responsive Design**: Modern UI with Tailwind CSS and DaisyUI
- **File Management**: Cloudinary integration for image storage
- **Performance Monitoring**: Django Silk for query optimization

## 🛠️ Tech Stack
- **Frontend:** JavaScript, Konva.js, Tailwind CSS, DaisyUI, AOS.js
- **Backend:** Django 5.1.3, Python
- **Database:** SQLite (development) / PostgreSQL (production)
- **Storage:** Cloudinary for media files
- **Styling:** Tailwind CSS with custom theme
- **Authentication:** Django Custom User Model
- **Monitoring:** Django Silk

## 📂 Project Structure
```
homedesign/
├── homedesign/          # Main project settings
├── homebase/            # Core app for products and categories
├── homeusers/           # Custom user management
├── dvp_user_side/       # User-facing functionality
├── theme/               # Tailwind CSS theme configuration
├── templates/           # HTML templates
├── static/              # Static files
├── media/               # Media uploads
├── requirements.txt     # Python dependencies
├── manage.py           # Django management script
└── README.md           # Project documentation
```

## 📋 Prerequisites
- Python 3.8 or higher
- Node.js and npm (for Tailwind CSS)
- Git

## 📂 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Burhan-Ameer/homedesign.git
cd homedesign
```

### 2️⃣ Set Up Virtual Environment
```bash
# Create virtual environment
python -m venv projenv

# Activate virtual environment
# On Windows:
projenv\Scripts\activate
# On macOS/Linux:
source projenv/bin/activate
```

### 3️⃣ Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4️⃣ Install Node.js Dependencies (for Tailwind)
```bash
cd theme/static_src
npm install
cd ../..
```

### 5️⃣ Environment Configuration
Create a `.env` file in the project root:
```env
# Django Configuration
DJANGO_DEBUG=True
# In .env file
# Database Configuration (Optional - defaults to SQLite)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
# In settings file
# Cloudinary Configuration (for media storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
# In Settings file
# Security Settings (for production)
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com
```

### 6️⃣ Database Setup
```bash
# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

### 7️⃣ Compile Tailwind CSS
```bash
# Development mode (watch for changes)
python manage.py tailwind start
```

### 8️⃣ Run the Development Server
```bash
python manage.py runserver
```

Access the platform at `http://127.0.0.1:8000/`

## 🎨 Usage

### For Users:
1. **Registration/Login**: Create an account or login to existing account
2. **Design Canvas**: Access the interactive design workspace
3. **Add Items**: Drag and drop furniture and decor items onto the canvas
4. **Customize**: Change colors, sizes, and positions of items
5. **Save Designs**: Save your creations for future reference
6. **Browse Catalog**: Explore available furniture and decor items

### For Administrators:
1. **Admin Panel**: Access at `/admin/` with superuser credentials
2. **Product Management**: Add, edit, and manage furniture items
3. **User Management**: Monitor and manage user accounts
4. **Category Management**: Organize products into categories
5. **Analytics**: Monitor platform usage with Django Silk at `/silk/`

## 🔧 Development


### Database Management
```bash
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (development only)
python manage.py flush
```

## 🚀 Deployment

### Production Settings
1. Set `DJANGO_DEBUG=False` in environment variables
2. Configure proper `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`
3. Use PostgreSQL database
4. Set up proper static file serving
5. Configure Cloudinary for media storage

### Environment Variables for Production
```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-production-secret-key
DATABASE_URL=your-production-database-url
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ALLOWED_HOSTS=your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com
```

## 🛡️ Security Considerations
- Use environment variables for sensitive data
- Enable HTTPS in production
- Regularly update dependencies
- Monitor with Django Silk for performance issues

## 🔍 Troubleshooting

### Common Issues:
1. **Tailwind not compiling**: Ensure Node.js and npm are installed
2. **Database errors**: Check database connection and run migrations
3. **Static files not loading**: Run `collectstatic` command
4. **Import errors**: Ensure virtual environment is activated

### Debug Mode:
- Set `DJANGO_DEBUG=True` for detailed error messages
- Check Django logs for specific error details
- Use Django Silk for query analysis

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📜 License
This project is open-source and licensed under the MIT License.

## 🤝 Contributors
- **Burhan Ameer** (Lead Developer)
- **Muhammad Atta** (Developer)
- **Sikander Sultan** (Developer)
## 📞 Support
For issues and questions:
- Contact: [burhanameer2@gmail.com]
- phone : 03214328169
---
⭐ Don't forget to star this repository if you found it helpful!


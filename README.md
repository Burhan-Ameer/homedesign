# DVP (Design Visualization Platform)

## 📌 Overview
DVP (Design Visualization Platform) is an interactive web-based tool that allows users to visualize, customize, and arrange furniture, room decor, and kitchen items in a digital environment. The platform provides a user-friendly interface to experiment with different layouts, colors, and arrangements before implementing them in real spaces.

## 🚀 Features
- Drag-and-drop functionality for furniture and decor items
- Real-time customization of colors and layouts
- Interactive 2D visualization using Konva.js
- Room color-based furniture suggestions
- Responsive and modern UI with Tailwind CSS
- Backend powered by Django for managing assets and user data

## 🛠️ Tech Stack
- **Frontend:** JavaScript, Konva.js, Tailwind CSS
- **Backend:** Django
- **Database:** SQLite / PostgreSQL (configurable)

## 📂 Installation & Setup
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/yourusername/dvip.git
cd dvip
```

### 2️⃣ Set Up Virtual Environment
```sh
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3️⃣ Install Dependencies
```sh
pip install -r requirements.txt
```

### 4️⃣ Apply Migrations
```sh
python manage.py migrate
```

### 5️⃣ Run the Development Server
```sh
python manage.py runserver
```
Access the platform at `http://127.0.0.1:8000/`

## 🎨 Usage
1. Open the platform in a browser.
2. Start adding furniture and decor items using the drag-and-drop interface.
3. Change item colors based on room themes.
4. Save or reset designs as needed.

## 📜 License
This project is open-source and licensed under the MIT License.

## 🤝 Contributors
- **Burhan Ameer** (Lead Developer)

---
Feel free to contribute by submitting issues or pull requests!


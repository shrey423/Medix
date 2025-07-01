# Medix Healthcare Platform

A modern healthcare platform that combines AI-powered disease prediction with telemedicine capabilities, featuring a microservices architecture with dedicated ML and application backends.

## 🌟 Features

- **AI Disease Prediction**
  - Multiple ML models (Logistic Regression, Random Forest, SVM, etc.)
  - Symptom-based disease analysis
  - Real-time disease prediction API
  - Support for 41 distinct disease categories

- **Telemedicine Portal**
  - Separate interfaces for doctors and patients
  - Secure Google OAuth authentication
  - Real-time consultations
  - Medical report management
  - Appointment scheduling

- **User Experience**
  - Modern, responsive UI built with React and Tailwind CSS
  - Intuitive symptom input system
  - Seamless authentication flow
  - Cross-platform compatibility

## 🛠️ Architecture

```
Frontend (React/TypeScript/Vite)
    ↙               ↘
ML Backend          Main Backend
(Flask/Python)      (Node.js/Express)
6ml/                backend/
- Disease           - Authentication
  Prediction        - User Management
- ML Models         - Appointments
- Symptom           - Consultations
  Analysis          - File Storage
```

## 🔧 Tech Stack

### Frontend (`/frontend`)
- React with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- @react-oauth/google for authentication

### Main Backend (`/backend`)
- Node.js/Express
- MongoDB for data storage
- JWT authentication
- Real-time communication
- File upload handling
- Google OAuth integration

### ML Backend (`/6ml`)
- Python Fast API
- scikit-learn ML models:
  - Logistic Regression
  - Decision Trees
  - Random Forest
  - SVM
  - Naive Bayes
  - K-Nearest Neighbors
- Pandas for data processing

## 🚀 Deployment

All services are deployed on Render:

### Frontend
- URL: https://medixfrontend.onrender.com
- Build Command: `npm run build`
- Output Directory: `dist`


## 🔒 Environment Setup

### Frontend (.env)
```env
VITE_BACKEND_URL=your backend url
VITE_ML_URL=your python backend url
VITE_PORT=5173
```

### Main Backend (.env)
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
API_KEY=gemini api key
API_KEY2=gemini api key

MODEL_NAME=gemini-1.5-pro
MODEL_NAME2=gemini-1.5-flash
```

## 🚀 Local Development

1. Clone the repository
```bash
git clone https://github.com/shrey423/Medix.git
cd medix
```

2. Set up Frontend
```bash
cd frontend
npm install
npm run dev
```

3. Set up Main Backend
```bash
cd backend
npm install
node server.js
```

4. Set up ML Backend
```bash
cd 6ml
pip install -r requirements.txt
python server.py
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- scikit-learn for ML tools
- React team for the amazing framework
- Tailwind CSS for the styling system
- Google OAuth for authentication
- All contributors who helped shape this project 

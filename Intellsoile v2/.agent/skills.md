# 🧠 Skills Configuration for IntelliSole

## 📌 Project Name
IntelliSole

---

## 🩺 Project Description
IntelliSole is a smart medical system designed to monitor foot pressure and temperature in real time.  

It helps detect early signs of foot complications and provides alerts, insights, emergency support, and personalized dashboards for patients and doctors.

---

## ⚙️ Tech Stack

### 🎨 Frontend
- Next.js (App Router)
- Tailwind CSS
- React + Zustand / Context API
- Real-time UI using Supabase Realtime
- Mobile-first responsive design
- Dashboard + Heatmap + Emergency Button

---

### ⚙️ Backend
- Supabase (PostgreSQL)
- Supabase Auth (Login system)
- Role-based access: Patient / Doctor
- REST APIs / Server Actions
- Data storage (sensor data, alerts, posts, tips, reports)
- Notifications system

---

### 📡 IoT System
- ESP32 microcontroller
- FSR Pressure Sensors
- DS18B20 Temperature Sensor
- WiFi communication (HTTP / MQTT)
- Battery monitoring
- Pump control & monitoring

---

### 🔄 Real-Time System
- Live sensor data streaming
- Instant alerts for abnormal pressure or temperature
- Real-time battery & pump status
- Supabase Realtime / WebSockets

---

## 🧩 Core Features

### 👤 User System
- Patient account (email + password)
- Doctor account
- Role-based access control
- Patient-specific dashboards

### 📊 Monitoring
- Pressure readings
- Temperature readings
- Heatmap visualization (dynamic)
- Graphs for historical data

### 🚨 Emergency System
- Emergency button for patient
- Sends alert to doctor
- Sends patient location
- Displays nearby hospitals
- Optional call/SMS notifications

### 💬 Community Section
- Posts & comments
- Interaction between patients and doctors
- Like / reply features

### 🧠 Tips Section
- Medical advice content
- Added & managed by doctors
- Daily / weekly recommendations

### 📄 Reports
- Generate PDF reports
- Summarize patient history
- Doctor-accessible

### ⚡ Notifications
- Battery low (<15%)
- Pump running too long or stopped
- Abnormal pressure/temperature alerts

---

## 🚀 Future Features
- AI analysis (anomaly detection & alerts)
- Risk prediction (predict diabetic foot risk)
- Mobile App for patient & doctor access
- Optional medical chatbot
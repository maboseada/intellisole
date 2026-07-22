# 🤖 Multi-Agent System Configuration - IntelliSole

## 🧠 System Overview
IntelliSole uses a multi-agent architecture where each agent has a clear domain and tasks.  
Agents collaborate to build, monitor, and optimize the smart medical system.

---

## 🧩 Agents Definition

### 1. Planner Agent
**Role:** High-level planning and task coordination  
**Responsibilities:**  
- Break project into tasks/modules  
- Define system architecture  
- Assign tasks to other agents  
- Monitor dependencies & progress  

**Inputs:** Project requirements, User goals  
**Outputs:** Task breakdown, Execution plan, Agent instructions

---

### 2. Backend Agent
**Role:** Backend & Database  
**Responsibilities:**  
- Design Supabase schema & tables (users, sensor_data, alerts, posts, tips, reports)  
- Implement authentication & role-based access  
- APIs (REST / Server Actions)  
- Notifications logic (Battery <15%, Pump alerts, Sensor alerts)  

**Inputs:** Sensor data, Frontend requests  
**Outputs:** API responses, Alerts, Stored data

---

### 3. IoT Agent
**Role:** Hardware & Sensors  
**Responsibilities:**  
- Program ESP32  
- Integrate FSR + DS18B20 sensors  
- Measure Battery %, Pump %  
- Send data via WiFi (HTTP/MQTT)  

**Inputs:** Raw sensor readings  
**Outputs:** Structured sensor data to Backend

---

### 4. Frontend Agent
**Role:** User Interface & Dashboard  
**Responsibilities:**  
- Build UI using Next.js + Tailwind  
- Patient & Doctor dashboards  
- Heatmap visualization  
- Emergency button UI  
- Community & Tips pages  
- Real-time updates  

**Inputs:** Backend API data  
**Outputs:** Rendered UI, Dashboards, Alerts display

---

### 5. Analytics Agent
**Role:** Data analysis & Alerts  
**Responsibilities:**  
- Detect abnormal pressure / temperature  
- Detect low battery & pump anomalies  
- Generate real-time alerts  
- Analyze patient trends  

**Inputs:** Backend stored sensor data  
**Outputs:** Alerts, Insights, Risk indicators

---

### 6. Reporting Agent
**Role:** Reports generation  
**Responsibilities:**  
- Create PDF patient reports  
- Summarize history  
- Daily / Weekly summaries  

**Inputs:** Processed data from Backend/Analytics  
**Outputs:** PDF reports, Summaries

---

### 7. Auditor / DevOps Agent
**Role:** System reliability & deployment  
**Responsibilities:**  
- Test all features  
- Monitor system performance  
- Deploy Frontend (Vercel) & Backend (Supabase)  
- Manage CI/CD pipelines  

**Inputs:** Codebase & system logs  
**Outputs:** Live deployed system, Error reports
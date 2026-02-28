# Life Manager

A minimalist, high-performance life management application with AI features, secure finance tracking, and fitness logging.

## 🐳 Running with Docker (Recommended)
The easiest way to run the entire stack (including Database and AI) is using Docker Compose:

1.  **Start all services:**
    ```bash
    docker-compose up --build
    ```
2.  **Wait for AI setup:** The `ollama-setup` container will automatically pull `llama3` and `llava` models. This might take a few minutes.
3.  **Access the app:**
    - Frontend: [http://localhost:4299](http://localhost:4299)
    - Backend API: [http://localhost:3000](http://localhost:3000)

---

## 🛠 Manual Setup (Local)

### 1. Database
Run `backend/src/database/schema.sql` in your MySQL instance.

### 2. Ollama (AI)
- Download and run [Ollama](https://ollama.com).
- Pull required models:
  ```bash
  ollama pull llama3
  ollama pull llava
  ```

### 3. Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```

### 4. Frontend (Angular)
```bash
cd frontend
npm install
npx ng serve --port 4299
```

---

## 🚀 Key Features
- **🍽 Food AI:** Camera scanner (vision) + Manual AI Kcal Estimator.
- **🏃 Smart Fitness:** Activity-specific forms (Cardio/Gym).
- **💰 Secure Finance:** AES-256 encrypted logs + AI goal planning.
- **✨ Insights:** Weekly AI-generated life advice.

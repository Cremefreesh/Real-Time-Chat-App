# Real-Time-Chat-App --> A productivity app with AI-assisted prioritization and collaboration.

Backend - Python + FastAPI:
      REST API (login, users, chat history)
      WebSocket connections (real-time messaging)

Frontend - React + Typescript:
      Real time updating

Database - PostgreSQL:
      Users
      Messages
      Semantic Search/Cosine Similarity 

Middlewear:
      Auth middleware (protect routes)
      Logging middleware
      Rate limiting (prevent spam)
      Error handling layer  
        
Real-time Layer:
      WebSockets (FastAPI)
      Redis (for scaling messages across servers)

Servers and Deployment:
      Docker (containerize backend + frontend)
      Deployment (AWS / Render / Fly.io)
      Nginx (reverse proxy)
      CI/CD (GitHub Actions)
      Environment configs

Other - Celeryu + Redis:
      Sending notifications
      Processing uploads
      Cleaning old data


Overview:

Frontend (React + TS)
        ↓
API Gateway (FastAPI)
        ↓
Auth Middleware+Logging Middleware   
        ↓
Business Logic Layer
        ↓
PostgreSQL (data)+Redis (cache/pubsub)  
        ↓
WebSocket Layer (real-time)
        ↓
Workers (Celery)


I built a real-time chat system using React and FastAPI with WebSockets, scaled using Redis pub/sub, implemented JWT authentication, background workers with Celery, and deployed it with Docker and CI/CD.

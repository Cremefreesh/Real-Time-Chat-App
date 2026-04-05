# Real-Time-Chat-App

Backend - Python + FastAPI:
      REST API (login, users, chat history)
      WebSocket connections (real-time messaging)
      Business logic

Database - PostgreSQL:
      Users
      Messages
      Conversations
      Relationships

Middlewear:
      Auth middleware (protect routes)
      Logging middleware
      Rate limiting (prevent spam)
      Error handling layer  
        
Real-time Layer:
      WebSockets (FastAPI or Socket.IO)
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





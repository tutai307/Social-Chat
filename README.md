# Social Chat API

## Overview

Social Chat API is a backend system for a mini social network that allows users to create profiles, connect with friends, publish posts, and communicate through realtime chat.

The project is designed as a **backend-focused system** to demonstrate modern Node.js architecture using NestJS, realtime communication, caching, and scalable messaging patterns.

This project aims to simulate a **production-style backend system** with modular architecture, authentication, messaging, and social features.

---

# Tech Stack

### Backend

* NestJS (Node.js framework)
* TypeScript

### Database

* MongoDB (primary database for users, posts, messages)

### Realtime Communication

* Socket.IO (realtime messaging)

### Authentication

* JWT Authentication
* Google OAuth

### Cache & Messaging

* Redis (caching, pub/sub)
* BullMQ (job queue system)

### Security

* Password hashing with bcrypt
* Message encryption (AES)

---

# System Architecture

The system follows a **modular backend architecture**.

Client
↓
REST API (NestJS Controllers)
↓
Service Layer (Business Logic)
↓
Database Layer (MongoDB)
↓
Realtime Layer (Socket.IO)
↓
Cache / Queue (Redis + BullMQ)

---

# Core Features

## Authentication

* User registration
* User login
* Google OAuth login
* JWT authentication
* Secure password hashing

## User Profile

* Create and update profile
* View public user profiles

## Friend System

* Send friend requests
* Accept friend requests
* Friend list management

## Blog / Social Feed

* Create posts
* View public posts
* React to posts (like / emoji)

## Comment System

* Nested comments (tree structure)
* Reply to comments

## Realtime Chat

* Private chat between users
* Group chat
* Realtime message delivery using WebSocket

## Message Security

* Encrypted messages
* Secure storage of chat history

## Content Sharing

* Share blog posts directly to chat conversations

---

# Project Structure

src/

auth/
users/
friends/
posts/
comments/
reactions/
conversations/
messages/

websocket/
redis/
queue/

common/
guards/
filters/

---

# API Design

The API follows a **RESTful architecture**.

Example endpoints:

POST /auth/register
POST /auth/login
GET /auth/me

POST /posts
GET /posts

POST /comments
GET /posts/:id/comments

POST /messages
GET /messages

---

# Development Goals

This project focuses on demonstrating:

* Clean backend architecture
* Scalable messaging system
* Realtime communication
* Efficient database design
* Modern Node.js backend practices

---

# Future Improvements

* Media upload support
* Notification system
* Search functionality
* Rate limiting
* Deployment with Docker
* CI/CD pipeline

---

# Author

Developed as a backend engineering practice project to explore scalable Node.js system design.

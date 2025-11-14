# FleetLink — Front-End Technical Challenge

## Introduction

Hello, developer.

Welcome to the FleetLink technical challenge — a startup modernizing the transportation sector by providing technology for truck drivers and fleet companies.

The goal of this challenge is to evaluate your ability to build a well-structured, typed, and scalable application, following best practices in code organization, componentization, and integration with external services.

---

## About FleetLink

FleetLink's mission is to connect drivers, trucks, and loads in a single platform, making it easier to manage routes, vehicles, and drivers.  
The platform should allow map visualization, entity linking, and real-time data updates, delivering a modern and efficient user experience.

---

## Required Technologies

The project must be built using the following technologies:

- React + TypeScript
- TailwindCSS v4 — for responsive and modern styling
- React Query — for caching, synchronization, and remote state management
- React Hook Form + Yup — for form handling and validation
- Mapbox GL JS — for displaying routes and interactive maps
- Firebase — for authentication, database, and optional storage
  - Auth (login/logout)
  - Firestore (real-time database)
  - Storage (optional, for document uploads)
- Global state management
  - You may use Zustand

---

## Authentication and Security

The system must include:

- Login and logout using Firebase Auth (email/password)
- Protected private routes (only accessible to authenticated users)
- Clear and visually pleasant feedback for loading and error states

---

## Main Modules

The application must contain three main modules: Trucks, Drivers, and Loads.  
All forms must use React Hook Form + Yup, showing clear and friendly error messages.

---

### Trucks

- Fields: license plate, model, capacity (kg), year, status (active/maintenance)
- Allow document upload (PDF/JPG) to Firebase Storage
- Display the linked driver, if available

---

### Drivers

- Fields: name, phone, driver's license (CNH), truckId (linked truck)
- Each driver can be linked to only one truck
- Allow listing of drivers and their linked trucks

---

### Loads

- Fields: description, weight, origin (address), destination (address), status (planned | in route | delivered), driver, and truck
- Each load belongs to a truck and a driver
- Display the route between origin and destination on the map

---

## Interactive Map (Mapbox)

Integrate Mapbox to display routes and load locations.

Expected features:

- Display the route between origin and destination (using Mapbox Directions API)
- Show markers for origin and destination
- Display load, driver, and truck details beside the map
- Save route data (distance, duration, coordinates) in Firestore

**Bonus:** simulate real-time truck movement along the route.

---

## Dashboard

The home page should display an overview of the system, including:

- Summary of loads by status (planned, in route, delivered)
- Count of active drivers and available trucks
- Table listing the latest created loads with their status and a "View Details" button

Data updates must occur in real time via Firestore and React Query.

---

## Business Rules and Relationships

The system must maintain consistency between drivers, trucks, and loads:

- A driver can only be linked to one truck
- A truck can only be linked to one driver
- A load must always belong to a truck that is linked to a driver
- When creating or updating links, the system must verify if an active relationship already exists

---

## UI/UX Requirements

- Dark mode
- Clean, responsive, and consistent design (Tailwind v4)
- Consistent use of colors, spacing, and typography
- Reusable components (Button, Input, Card, Table, Badge, Modal)
- Well-defined loading, error, and empty states
- Clear feedback for user actions (confirmations, error messages, etc.)
- Use this colors - '#0f1a2b', '#F5F7FA', '24, 57, 109, 0.43', '#ffffff', '#223A5F', #13294C, '#808080', '#3887FF'

---

## Bonus (Optional)

Extra implementations that add value:

- Global state persistence
- Testing (React Testing Library or Vitest)
- Bundle optimizations (lazy loading, code splitting)

## Submission

- Host your source code on a public repository (e.g., GitHub).
- Provide clear instructions on how to run the project.
- Include documentation explaining your technical decisions.

test-front-end.md
Displaying test-front-end.md.

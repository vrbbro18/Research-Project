⬡ Smart Highway Speed Violation Prediction & Management System
From Delayed Fines to Real-Time Behavioral Correction








Project ID: 25-26J-314
Degree Programme: BSc (Hons) in Information Technology
Faculty: Computing | Sri Lanka Institute of Information Technology

◈ Why This Project Exists (In One Minute)

On Sri Lankan expressways, speed violations are detected late, reported later, and corrected never.

Drivers often receive fines weeks after the violation — long after the moment when behavior could have been corrected. Existing systems focus on vehicles, not drivers, and provide no insight into whether enforcement actually changes behavior.

This project was built to answer a simple research question:

What happens when enforcement feedback is delivered instantly — and can that feedback measurably change driver behavior?

◉ What We Built (High-Level)

This system transforms highway enforcement into a real-time, data-driven safety ecosystem by combining:

RFID-based driver & vehicle identity verification

Machine learning–based monitoring and analysis

Instant digital enforcement alerts

Behavioral change measurement and prediction

▣ The Core Research Gap We Address
Existing Systems	Our Approach
Vehicle-only identification	Driver–vehicle linkage
Delayed enforcement	Instant digital feedback
Punishment-focused	Behavior-aware correction
Reactive operations	Predictive planning
⌬ Research Architecture (Component View)

This project is structured as five tightly integrated research pillars, each addressing a distinct scientific gap.

◧ Dashboard & Driver Alert System (Member 1)

Research Question:
Does real-time digital feedback reduce repeat speed violations?

What it contributes:

Live violation stream via WebSockets

Secure authority dashboard

Instant SMS/Email alerts

Before vs After behavior analysis

Quantifiable compliance metrics

◨ IoT & RFID Identity Infrastructure (Member 5)

ESP32 + RC522 gantry system

Dual RFID scan (Driver License + License Plate)

Reliable identity verification under rain and fog

◩ ML Speed & Vehicle Analysis (Member 2)

YOLOv8 vehicle classification

Perspective transformation for speed validation

Visual + RFID cross-verification

◪ Driver Behavior & Mental State Monitoring (Member 4)

Drowsiness and emotion detection

Context-aware audio intervention

Human-factor risk reduction

◫ Intelligent Accident Response & Statistical Forecasting (Member 3)

Crash detection via sensors

Injury severity assessment

Short-term risk forecasting

Emergency resource prioritization

⟳ System Operation (End-to-End)

Identity Capture – RFID gantries record driver + vehicle

Continuous Monitoring – In-cabin and roadside AI operate

Violation Calculation – Segment-based speed computation

Instant Enforcement – Alerts issued in real time

Research Feedback Loop – Behavior patterns analyzed

✦ What Makes This System Distinct

Driver-centric enforcement logic

Immediate behavioral intervention

Weather-resilient identification

Research-driven evaluation loop

Scalable national design

⊕ Expected Research Outcomes

Reduced repeat speeding behavior

Improved driver awareness

Faster emergency response

Predictive risk identification

Evidence-backed enforcement policies

⚙ Technology Snapshot

Hardware
ESP32 · RC522 · Accelerometers

Machine Learning
YOLOv8 · PyTorch · Scikit-learn · Statsmodels

Backend
FastAPI · MongoDB · WebSockets

Frontend
React · Tailwind CSS · Lucide Icons

◎ Research Team

Member 1 – Dashboard & Behavioral Impact Analysis

Member 2 – ML Speed & Vehicle Recognition

Member 3 – Accident Response & Statistical Forecasting

Member 4 – Driver Behavior & Mental State Monitoring

Member 5 – IoT & RFID Infrastructure

◌ Final Note

This repository represents a research-driven system, not just an application.
Its value lies in measuring behavioral change, improving safety outcomes, and supporting real-time decision-making.

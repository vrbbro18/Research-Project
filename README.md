# 🚦 Smart Highway Speed Violation Prediction & Management System
![SLIIT](https://img.shields.io/badge/SLIIT-Faculty%20of%20Computing-blue)
![Research](https://img.shields.io/badge/Type-Undergraduate%20Research-success)
![IoT](https://img.shields.io/badge/Domain-IoT%20%7C%20ML%20%7C%20ITS-orange)
![Status](https://img.shields.io/badge/Status-Active%20Development-yellow)
![License](https://img.shields.io/badge/License-Academic-lightgrey)

🆔 **Project ID:** 25-26J-314  
🎓 **Degree:** BSc (Hons) in Information Technology  
🏫 **Institute:** Sri Lanka Institute of Information Technology (SLIIT)  
📚 **Module:** Final Year Research Project  

---

## 📌 Table of Contents
- Research Overview  
- Problem Background & Motivation  
- Research Objectives  
- Individual Research Pillars  
- System Operational Flow
- Design Excellence & Novelty  
- Research Advantages & Expected Outcomes  
- System Architecture Diagram  
- Dashboard & Alert Screenshots  
- Technical Stack  
- Repository Structure  
- Setup & Installation  
- Research Team  

---

## 📖 Research Overview

Road traffic enforcement in Sri Lanka remains largely **manual, reactive, and vehicle-centric**, resulting in delayed interventions and limited behavioral correction. Existing systems identify *which vehicle* violated speed limits but fail to verify *who was driving*, provide immediate feedback, or support predictive enforcement.

This research proposes a **Smart Highway Speed Violation Prediction & Management System** that integrates:

- RFID-enabled driver & vehicle identity verification  
- Machine Learning-based speed and behavioral monitoring  
- Real-time enforcement dashboards  
- Immediate driver alert and behavior correction mechanisms  

By linking the **driver’s license with the vehicle plate in real time**, the system introduces a **proactive, data-driven enforcement framework** that improves accountability, reduces repeat violations, and supports evidence-based traffic policy decisions.

---

## 🎯 Problem Background & Motivation

According to WHO statistics, overspeeding is one of the leading causes of fatal road accidents in Sri Lanka. Current enforcement mechanisms suffer from:

- Limited spatial coverage  
- High dependency on human intervention  
- Poor performance under adverse weather conditions  
- Delayed violation notification  
- Lack of behavioral impact assessment  

This research directly addresses these gaps by introducing **real-time enforcement with measurable driver behavior change**, aligned with national road safety improvement goals.

---

## 🎯 Research Objectives 

### Main Objective
To design and evaluate an **IoT and Machine Learning–based smart traffic enforcement system** that enables real-time speed violation detection, immediate driver feedback, and predictive risk analysis to reduce overspeeding-related accidents in Sri Lanka.

### Specific Objectives
- To develop a centralized, secure dashboard for real-time violation monitoring  
- To implement RFID-based dual identity verification for drivers and vehicles  
- To integrate machine learning models for speed, behavior, and risk analysis  
- To evaluate the impact of real-time alerts on driver behavior  
- To support data-driven enforcement and policy planning  

---

## 🏗️ Individual Research Pillars

### 🖥️ Dashboard & Driver Alert System *(Member 1 – You)*  
**Research Focus:**  
Measuring the effectiveness of **real-time digital interventions** on driver compliance.

**Key Contributions:**
- Secure, role-based enforcement dashboard  
- Live violation visualization using charts and heatmaps  
- Automated SMS/Email alerts upon violation detection  
- **Driver behavior change analysis (pre-alert vs post-alert)**  
- Quantifiable compliance metrics for research evaluation  

---

### 🏷️ IoT & RFID Identification *(Member 5)*  
- ESP32 + RC522 RFID gantry system  
- Dual scanning of Smart License Plate and Driver License  
- Non-line-of-sight, weather-resilient identity verification  

---

### 👁️ ML Speed & Behavioral Monitoring *(Member 2)*  
- YOLOv8-based vehicle classification  
- Perspective transformation for visual speed estimation  
- Speed cross-validation with RFID data  

---

### 🎵 Driver Behavior & Music Intervention *(Member 4)*  
- Drowsiness and emotion detection  
- Context-aware music-based alertness restoration  
- Human-centered safety enhancement  

---

### 📊 Accident Response & Statistical Forecasting *(Member 3)*  
- Poisson Distribution-based accident hotspot prediction  
- Injury severity assessment  
- Resource prioritization for traffic authorities  

---

## 🔄 System Operational Flow (End-to-End)

1. **Entry – IoT Layer**  
   Vehicle enters highway segment → RFID tags scanned → Entry time recorded.

2. **Monitoring – ML & Behavior Layer**  
   Driver state monitored → Music intervention triggered if required.

3. **Detection – Analytics Layer**  
   Exit RFID scan → Average speed calculated  
   \[
   Speed = \frac{Distance}{Time}
   \]

4. **Enforcement – Dashboard Layer**  
   Violation detected → Instant SMS/Email alert sent → Live dashboard update.

5. **Evaluation – Research Loop**  
   Driver behavior analyzed → Predictive heatmaps updated → Policy insights generated.

---

## 🛡️ Design Excellence & Novelty

- **Dual-ID Verification:** Identifies *who* is driving, not just *which vehicle*  
- **Real-Time Behavioral Correction:** Alerts delivered during the trip  
- **Environment Resilience:** Operates under rain, fog, and dust  
- **Research-Centric Design:** Measures actual behavioral change  

---

## 📈 Research Advantages & Expected Outcomes

- Reduction in repeat overspeeding incidents  
- Improved driver awareness and compliance  
- Predictive identification of high-risk zones  
- Evidence-based traffic enforcement strategies  
- Scalable architecture for national deployment  

---

## 🛠️ Technical Stack

**Hardware**
- ESP32  
- RC522 RFID Readers  
- Accelerometers  

**Machine Learning**
- YOLOv8  
- PyTorch  
- Scikit-learn  
- Statsmodels  

**Backend**
- FastAPI (Python)  
- MongoDB  
- WebSockets  

**Frontend**
- React.js  
- Tailwind CSS  
- Lucide Icons  

---


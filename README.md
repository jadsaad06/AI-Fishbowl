# AI Fishbowl

**AI Fishbowl** is an interactive conversational AI installation developed as a **Portland State University Computer Science capstone project**. The system presents a voice-driven digital fish housed within a virtual aquarium, enabling users to engage in natural, spoken conversations through real-time speech recognition, language model reasoning, and text-to-speech synthesis.

The project explores how multimodal AI systems can be integrated into a cohesive, character-driven experience suitable for public and educational environments.

---

## Overview

AI Fishbowl provides a hands-free conversational interface designed to support university-related use cases, including general CS guidance and informational interaction. The installation emphasizes clarity, responsiveness, and system modularity, while maintaining a polished and approachable user experience.

---

## Core Capabilities

- **Speech-to-Text (STT)**  
  Real-time transcription of user speech for conversational input.

- **Conversational Reasoning**  
  LLM-based agent logic for intent interpretation, context management, and response generation.

- **Text-to-Speech (TTS)**  
  High-quality speech synthesis for audible system responses.

- **Visual Character Interface**  
  An animated digital fish rendered within an aquarium environment, synchronized with conversational output.

- **Educational Context**  
  Tailored for Portland State University Computer Science–related interactions.

---

## High-Level Architecture
```
Audio Input
↓
Speech-to-Text (STT)
↓
Conversation & Agent Logic
↓
Text-to-Speech (TTS)
↓
Visual + Audio Output
```


The architecture separates **input/output pipelines** (STT, TTS) from **agent reasoning**, enabling modular development, testing, and future extensibility.

---

## Technology Stack

- **Speech Recognition:** Real-time Google Cloud STT engine  
- **Language Model:** Gemini 2.5 Flash with RAG DB Implementation 
- **Speech Synthesis:** Google Cloud TTS  
- **Frontend:** Animated Fishbowl interface  
- **Backend:** Modular MCP-style service architecture with FastAPI integration for cross-component communication
- **Target Hardware:** Edge-capable deployment platform

---

## Project Objectives

- Design a robust, voice-first conversational AI system  
- Demonstrate modular agent-based architecture in a real-world installation  
- Deliver a professional, public-facing capstone project  
- Explore multimodal interaction beyond traditional chat interfaces

---

## Project Status

**In Development**  
System architecture, agent logic, and interaction pipelines are actively under construction.

---

## Team

Developed by a multidisciplinary **Portland State University Computer Science capstone team**, with contributions spanning AI systems, backend services, UI/UX, and hardware integration.

---

## Repository Notes

This repository reflects ongoing development.  
Architectural decisions, interfaces, and documentation may evolve as the project matures.

---

*AI Fishbowl demonstrates how conversational AI can be embedded into immersive, character-driven installations for educational environments.*



# Devpost Hackathon Submission: SurgiGuard AI v2.0
## AI-Assisted Intra-Operative Surgical Reconciliation Platform

---

### 🏷️ Project Details
- **Project Title:** SurgiGuard AI (Enterprise Clinical & Hardware Fusion Edition)
- **Tagline:** Eliminating Retained Foreign Objects (RFO) in Operating Theaters with Gemini 2.5 Flash, Deterministic Closure Gates, Gravimetric Blood Loss Tracking & FHIR R4 Interoperability.
- **Repository:** `https://github.com/fokrulanthro16-eng/surgiguard-ai`
- **Primary Category:** Google Gemini API & Multimodal AI / Healthcare & Life Sciences

---

### 💡 Elevator Pitch
Retained Foreign Objects (RFOs)—sponges, needles, clamps inadvertently left inside patients—cause over **4,000 surgical emergencies annually**, leading to catastrophic sepsis, emergency re-operations, and **\$1.3 billion** in preventable malpractice costs. **SurgiGuard AI** is an intra-operative AI surgical reconciliation platform that pairs **multimodal Gemini 2.5 Flash computer vision** and **gravimetric sponge fluid telemetry** with a **zero-hallucination deterministic safety kernel**. Guided by the axiom *"Rules Engine Decides, AI Explains"*, Gemini detects objects, verifies radiopaque barium markers, and broadcasts spoken OR briefings, while the pure mathematical closure gate holds absolute authority over patient fascial closure.

---

### 🩺 Clinical Inspiration & The RFO Crisis
In high-stress emergency surgeries (trauma, hemorrhagic colectomies), surgical teams rely on manual whiteboard tallies. When multiple sterile packs are opened under pressure or blood obscures the field, human counting errors occur. 
Current sponge-counting technologies are either proprietary closed RF wands (cost-prohibitive) or simple barcode scanners that slow down surgical flow.

We asked: *Can multimodal Gemini 2.5 Flash vision and touchless voice recognition autonomously audit the sterile Mayo tray in real time, calculate patient blood loss gravimetrically, and enforce mathematical closure gates with FDA 21 CFR Part 11 cryptographic blackbox auditability?*

---

### ⚡ What SurgiGuard AI Does
1. **Multimodal Mayo Tray Optical Scanner (Gemini 2.5 Flash):**
   - Real-time video ingestion from 4K OR optical streams or webcams.
   - Generates structured bounding boxes, item counts, and verifies radiopaque X-ray barium tags.
2. **Deterministic Safety Kernel & Sovereign Closure Gate:**
   $$\text{Delta} = \text{Baseline} - \text{TrayOut}$$
   $$\text{Closure Condition} \iff (\text{Delta} == 0) \land (\text{CavityIn} == 0) \land (\text{WHO Checklist Complete})$$
   - AI proposals cannot bypass mathematical discrepancies. The sovereign gate strictly enforces `CLEARED [GO]` vs `DISCREPANCY [HOLD]`.
3. **Gravimetric Sponge Fluid & Blood Loss Estimator (EBL):**
   $$\text{EBL (mL)} = \frac{\sum (\text{Wet Weight} - \text{Dry Baseline Tare})}{1.06\text{ g/mL}}$$
   - Live scale telemetry with automated Hemovigilance severity escalation (Normal, Elevated, Critical Hemorrhage).
4. **Touchless Hands-Free Voice Dispatcher:**
   - Web Speech API integration parsing spoken commands (*"SurgiGuard, verify sponge count"*, *"SurgiGuard, add sterile pack sponges five"*).
5. **Optical Field Occlusion Guard:**
   - Scores Mayo tray surface visibility and flags warnings if gloved hands or drapes obstruct visual counting.
6. **Cryptographic SHA-256 Merkle Ledger & FHIR R4 Standard Export:**
   - Immutable audit trail linking every surgical event.
   - One-click export of HL7 FHIR R4 `Procedure` and `Observation` JSON bundles with LOINC `80347-8` (Count Panel) and LOINC `55284-4` (EBL).

---

### 🧠 How We Built It & How Gemini 2.5 Flash Was Used
- **Frontend & UI:** Next.js 15+ App Router, React 19, TypeScript (Strict Mode), Tailwind CSS with Obsidian Medical Slate aesthetic.
- **Multimodal AI:** Google Gemini 2.5 Flash API with strict Zod schema parsing, temperature tuning for zero hallucinations, and fallback resilience for hackathon demos.
- **Pure Mathematical Engine:** Zero-dependency TypeScript safety kernels with 34 automated unit and integration tests via Vitest.
- **Cryptographic Chaining:** Universal SHA-256 hash chaining compatible across browser Web Crypto and Node.js.

---

### 🏆 Accomplishments We're Proud Of
- **100% Test Coverage:** 34 passing tests verifying mathematical invariants, dynamic packs, WHO checklist gating, and SHA-256 tamper detection.
- **Real-Time Tamper Simulation:** Interactive button that mutates block #2 payload and detects the broken hash pointer in under 1ms.
- **Touchless OR Workflow:** Full voice command execution allowing sterile scrub nurses to interact with the system without breaking surgical asepsis.

---

### 🏷️ Devpost Tags
`Gemini API`, `Gemini 2.5 Flash`, `Next.js 15`, `React 19`, `TypeScript`, `Healthcare`, `Biomedical Engineering`, `FHIR R4`, `LOINC`, `SNOMED-CT`, `Computer Vision`, `Voice AI`, `Cybersecurity`, `SHA-256`, `Vitest`.

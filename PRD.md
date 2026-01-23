# Planning Guide

Basma is an intelligent voice-enabled customer service platform designed for Arabic-speaking markets, specializing in healthcare appointment booking, call routing, and patient triage with native Saudi dialect comprehension. The system features a modern CallLinc interface with enhanced female voice output and seamless integration with the comprehensive dashboard.

**Experience Qualities**:
1. **Welcoming** - The interface should feel approachable and reassuring, especially for healthcare seekers who may be anxious or uncertain. The CallLinc interface provides a calming, intuitive voice interaction experience.
2. **Intelligent** - Demonstrate sophisticated AI capabilities through smooth voice interactions and context-aware responses that understand nuanced Arabic dialects, with enhanced female voice synthesis for natural conversation.
3. **Efficient** - Streamline the call handling process with clear visual feedback and quick access to key functions like routing and appointment management through both voice and traditional dashboard interfaces.

**Complexity Level**: Light Application (multiple features with basic state)
This is a demonstration interface for a voice AI system with core features like call simulation, appointment booking, caller routing, and triage visualization. The CallLinc interface provides a modern, mobile-app-inspired voice interaction layer while the comprehensive dashboard offers detailed management and analytics capabilities.

## Essential Features

### CallLinc Voice Interface (NEW - Primary Interface)
- **Functionality**: Modern voice call interface with large circular microphone button, concentric pulsing animations, quick response buttons (Yes/No/Thanks in English and Arabic), and bottom navigation tabs for Voice, Text Chat, and Insights
- **Purpose**: Provides an intuitive, visually striking voice interaction experience modeled after modern voice AI applications, with enhanced female voice output for natural conversation
- **Trigger**: Default landing view when app loads or accessed via "CallLinc" tab
- **Progression**: Interface loads with animated gradient background → Large microphone button displayed → User taps to activate voice input → Concentric pulse rings animate → Voice detected → Real-time transcription shown below → AI responds with female-enhanced voice → Quick response buttons provide shortcuts → Navigation allows switching to dashboard views
- **Success criteria**: Smooth animations at 60fps, voice input activates immediately on tap, pulsing rings animate during active listening, female voice synthesis works in both Arabic and English, quick response buttons send messages instantly, interface adapts to call state (idle/active/ended)

### Enhanced Female Voice Output
- **Functionality**: Automatically selects high-quality female voice for speech synthesis, prioritizing Arabic female voices with fallback options
- **Purpose**: Provides a more natural, engaging conversational experience aligned with Basma's identity
- **Trigger**: Any AI response that needs to be spoken aloud
- **Progression**: AI generates text response → Voice synthesis initialized → Female Arabic voice selected (Laila, Samantha, or best available) → Speech output begins → Visual indicators show speaking state
- **Success criteria**: Female voice selected consistently across sessions, natural intonation for both Arabic and English, clear pronunciation of medical and technical terms, smooth voice characteristics without robotic artifacts

### Voice Call Simulation
- **Functionality**: Handles real voice calls with Web Speech API for live transcription and speech synthesis for voice responses, supporting both Arabic and English voice input and output. Includes automatic voice activity detection that pauses Basma's speech when the user starts speaking, with real-time visual volume level indicators showing audio activity.
- **Purpose**: Demonstrates Basma's ability to handle actual Arabic voice conversations with real-time speech recognition for Saudi dialects and natural-sounding voice responses, creating natural conversation flow by intelligently managing turn-taking with visual feedback of audio levels
- **Trigger**: User clicks "Start Call" button, then uses microphone button to speak
- **Progression**: Button click → Call connects with audio wave animation → Voice activity detection starts monitoring → AI greeting plays with voice synthesis → User clicks microphone button → Browser requests permission → User speaks in Arabic/English → Voice activity detected with real-time volume bars showing audio levels, Basma's speech automatically pauses → Real-time transcription appears → User sends transcribed message → AI processes in Arabic/English → Response displayed with voice indicator → Basma speaks response using speech synthesis → Volume level indicator continuously displays audio activity in decibels → Voice activity detection continuously monitors for interruptions → Call can be routed/completed
- **Success criteria**: Speech recognition works in both Arabic (ar-SA) and English (en-US), real-time transcription displays correctly, Arabic text displays with proper RTL, interim results show during speech, final transcription sent as message, AI responses are spoken aloud with proper language detection, voice can be toggled on/off, voice activity detection automatically pauses speech output when user starts speaking, visual indicators show when voice is detected, volume level bars animate in real-time showing audio intensity with color-coded levels (green/yellow/red), decibel measurement displayed accurately, smooth conversation turn-taking without audio overlap

### Intelligent Call Routing
- **Functionality**: Routes callers to appropriate departments (General Inquiry, Appointments, Emergency, Billing) based on intent
- **Purpose**: Demonstrates AI's ability to understand caller needs and direct them efficiently
- **Trigger**: AI detects routing keywords during conversation or user manually selects department
- **Progression**: Caller states need → AI analyzes intent → Department identified → Routing confirmation shown → Transfer initiated → Success message
- **Success criteria**: Correct department selected based on input, smooth visual transition to routed state

### Appointment Booking System
- **Functionality**: Captures appointment requests with date, time, doctor specialty, and caller details
- **Purpose**: Core healthcare function - allowing patients to book appointments through voice
- **Trigger**: Caller mentions appointment booking or clicks "Book Appointment" action
- **Progression**: Intent detected → Form appears with pre-filled info from conversation → User confirms/edits details → Date/time selection → Appointment saved → Confirmation with reference number
- **Success criteria**: Appointments persist in storage, display in list view, show upcoming appointments prominently

### Health Triage Assistant
- **Functionality**: Assesses urgency of health concerns and recommends appropriate action level (Routine, Urgent, Emergency)
- **Purpose**: Helps prioritize patient care and direct emergency cases appropriately
- **Trigger**: Caller describes symptoms or health concerns
- **Progression**: Symptoms described → AI analyzes urgency → Triage level assigned (green/yellow/red) → Recommended action displayed → Appointment priority set or emergency protocol triggered
- **Success criteria**: Triage levels clearly color-coded, appropriate urgency messages displayed, emergency cases flagged prominently

### Conversation History & Analytics
- **Functionality**: Displays call history with transcripts, outcomes, and basic analytics
- **Purpose**: Provides oversight of system performance and caller patterns
- **Trigger**: User views dashboard or selects "Call History" tab
- **Progression**: Dashboard loads → Recent calls displayed with key metrics → User clicks call → Full transcript and details shown → Can review routing decisions and outcomes
- **Success criteria**: All calls stored with timestamps, searchable/filterable, key metrics (avg duration, routing accuracy) calculated

## Edge Case Handling

- **Dialect Recognition Failure**: If AI cannot understand dialect, offer to switch to Modern Standard Arabic or display helpful Arabic text prompts; Web Speech API automatically handles dialect variations
- **Microphone Permission Denied**: Clear message displayed when user denies microphone access, with fallback to text input; voice activity detection gracefully disabled
- **Speech Synthesis Unavailable**: When speech synthesis is not supported, gracefully disable voice output with visual indicator
- **Voice Activity Detection Unavailable**: When browser doesn't support AudioContext API, system falls back to manual speech control without automatic interruption
- **Browser Compatibility**: Graceful degradation to text-only input/output when Web Speech API is not supported (Safari, older browsers)
- **Language Detection**: Automatically detects Arabic vs English in AI responses to use correct voice synthesis language
- **Voice Interruption**: Voice activity detection automatically pauses speech synthesis when user starts speaking; new voice responses cancel previous ongoing speech to prevent overlapping audio
- **Emergency Detection**: Any mention of chest pain, severe bleeding, difficulty breathing automatically triggers emergency protocol with visual alert
- **Unclear Intent**: When routing is ambiguous, AI asks clarifying question rather than guessing, showing multiple options
- **Appointment Conflicts**: System checks for double-bookings and suggests alternative times
- **Call Disconnection**: Saves conversation state and allows resuming from last point if reconnected
- **No Available Slots**: When requested time unavailable, AI automatically suggests 3 nearest alternatives
- **Language Mixing**: Handles code-switching between Arabic and English seamlessly in Saudi context

## Design Direction

The design should evoke trust, modernity, and cultural sensitivity - feeling both technologically advanced and warmly human. Think of a high-end healthcare facility in Riyadh: clean, sophisticated, with touches of warmth through thoughtful color and generous spacing. The interface should feel calm and organized, never cluttered or anxiety-inducing, with subtle nods to Arabic design aesthetics through geometric patterns and fluid motion.

## Color Selection

A healthcare-focused palette that balances medical professionalism with Middle Eastern warmth, using deep teals and rich accent colors.

- **Primary Color**: Medical Teal `oklch(0.55 0.12 200)` - Communicates healthcare trust and technological sophistication, reminiscent of medical environments
- **Secondary Colors**: 
  - Warm Sand `oklch(0.92 0.02 80)` - Soft, neutral background that feels warm and welcoming rather than stark clinical white
  - Deep Navy `oklch(0.25 0.05 250)` - For important text and headers, providing strong contrast and authority
- **Accent Color**: Royal Gold `oklch(0.70 0.15 80)` - Attention-grabbing highlight for CTAs and status indicators, culturally resonant with Gulf aesthetics
- **Foreground/Background Pairings**:
  - Background (Warm Sand #F5F3ED): Deep Navy text (#1E2337) - Ratio 12.1:1 ✓
  - Primary (Medical Teal #39A9A0): White text (#FFFFFF) - Ratio 4.6:1 ✓
  - Accent (Royal Gold #C9A758): Deep Navy text (#1E2337) - Ratio 6.8:1 ✓
  - Emergency Red `oklch(0.55 0.22 25)`: White text - Ratio 5.2:1 ✓
  - Success Green `oklch(0.60 0.15 145)`: White text - Ratio 4.8:1 ✓

## Font Selection

Typography should feel modern and highly legible while supporting Arabic script beautifully - IBM Plex Sans Arabic offers excellent Arabic language support with a technical, professional feel perfect for a healthcare AI platform, paired with clean geometric sans for English.

- **Typographic Hierarchy**:
  - H1 (App Title "Basma"): IBM Plex Sans Arabic Bold/36px/tight letter spacing, mixed Arabic-English
  - H2 (Section Headers): IBM Plex Sans Arabic SemiBold/24px/normal spacing
  - H3 (Card Titles): IBM Plex Sans Arabic Medium/18px/normal spacing
  - Body (Conversation Text): IBM Plex Sans Arabic Regular/16px/relaxed line height 1.7 for readability
  - Caption (Timestamps, Metadata): IBM Plex Sans Arabic Regular/14px/muted color
  - Button Text: IBM Plex Sans Arabic Medium/16px/tracking-wide for emphasis

## Animations

Animations should feel smooth and reassuring like a calm healthcare professional - nothing jarring or sudden. Use gentle fades for state transitions, subtle pulse effects for active call indicators, and flowing wave animations for voice activity. The audio visualization should feel organic and alive, similar to breath or heartbeat rhythms. Volume level bars should animate fluidly with scaling and color transitions responding to real-time audio input. Routing transitions should feel like a gentle hand-off with sliding cards. Keep most animations in the 300-400ms range for a responsive but never rushed feeling, with micro-interactions (button presses) at 150ms for immediate feedback, and real-time volume indicators updating continuously at 60fps for smooth visual feedback.

## Component Selection

- **Components**:
  - **Card**: Primary container for call interface, appointment cards, and history items with subtle shadows
  - **Button**: Primary actions (Start Call, Book, Route) in teal, secondary in sand with teal borders, destructive in red for emergency
  - **Avatar**: Caller identification with initials or icons, supporting RTL for Arabic names
  - **Badge**: Status indicators (Active, Routed, Completed) and triage levels (Routine/Urgent/Emergency) with appropriate colors
  - **Dialog**: Appointment booking form and detailed call information
  - **Tabs**: Navigation between Dashboard, Active Calls, History, Analytics
  - **Progress**: Visual indicator for call duration and appointment booking steps
  - **Separator**: Subtle dividers between conversation messages
  - **Scroll Area**: Conversation transcript that auto-scrolls to newest messages
  - **Input/Textarea**: Simulated voice input (text) with Arabic RTL support
  - **Calendar**: Date picker for appointment booking (react-day-picker)

- **Customizations**:
  - **Audio Wave Visualization**: Custom SVG component showing animated wave bars that pulse with voice activity
  - **Volume Level Indicator**: Real-time horizontal bar graph displaying audio activity levels in decibels, with 15 animated bars that scale and change color (green/yellow/red) based on volume intensity
  - **Call Status Indicator**: Pulsing dot animation in teal during active calls
  - **Triage Level Cards**: Color-coded cards (green/yellow/red) with icons and urgency levels
  - **Arabic Text Direction**: All text inputs and conversation displays properly handle RTL with dir="auto"
  - **Department Icons**: Custom icons for routing destinations using Phosphor icons (Hospital, Calendar, Warning, CreditCard)

- **States**:
  - **Buttons**: Idle (solid teal), Hover (darker teal with subtle lift), Active (pressed with scale), Disabled (muted sand with low opacity), Loading (spinner in button)
  - **Call State**: Idle/Incoming/Active/Routing/Completed with distinct visual indicators
  - **Input Fields**: Default (border-sand), Focus (border-teal with glow), Filled (subtle background), Error (border-red with message)
  - **Cards**: Default (subtle shadow), Hover (lifted shadow for clickable items), Active Call (teal border glow)

- **Icon Selection**:
  - Phone/PhoneCall: Incoming calls and call actions
  - Microphone/MicrophoneSlash: Real-time voice input control (active/inactive states) and voice activity detection indicator
  - SpeakerHigh/SpeakerSlash: Voice output control (enabled/disabled states)
  - Calendar: Appointment booking
  - ClockCounterClockwise: Call history
  - ChartLine: Analytics
  - Hospital: Healthcare routing
  - Warning: Emergency/triage alerts
  - ArrowRight/CaretRight: Routing flow
  - User/UserCircle: Caller identification
  - CheckCircle: Completed actions

- **Spacing**:
  - Consistent padding: Cards (p-6), Buttons (px-6 py-3), Sections (space-y-6)
  - Generous gaps: Flex/Grid layouts (gap-4 for related items, gap-8 for sections)
  - Breathing room: Conversation messages (my-4), Section margins (mb-8)
  - Compact lists: History items (py-3) with separators

- **Mobile**:
  - Stack tabs vertically as bottom sheet navigation
  - Full-width cards with reduced padding (p-4)
  - Larger touch targets for call controls (min 48px)
  - Simplified audio visualization for performance
  - Single column layout for all views
  - Floating action button for "Start Call" on mobile
  - Collapsible appointment details (show summary, expand for full)

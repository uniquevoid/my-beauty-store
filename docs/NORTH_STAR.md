# Business Context & Product North Star: AI-Powered Career Sites

## 1. Executive Summary & Vision (The North Star)

The mission is to bridge the gap between archaic legacy Applicant Tracking Systems (ATS) and the modern, high-converting talent acquisition experiences expected by top-tier candidates today. Most mid-market and enterprise organizations are locked into legacy ATS platforms that deliver poor, unoptimized frontend experiences. We provide a decoupled, AI-powered, high-conversion career site layer that sits on top of any legacy infrastructure.

### The Core Value Proposition

- **For Candidates:** Hyper-personalized, AI-guided job search and application experience.
- **For Customers:** Increased conversion from visitor to applicant and modern branding without replacing core HR infrastructure.
- **For Our Sales Engine:** A zero-friction, automated visual hook using bespoke, production-grade visual demos.

## 2. The Sales Engine: Automated Demo Architecture

The differentiator for outbound sales is the **Autonomous Tailored Demo Engine**. We reach out to prospects with a fully white-labeled demo environment that mimics their exact brand identity and visual language.

### The Extraction & Demo Flow

- **Visual Asset Extraction (Playwright):** A headless worker navigates the prospect's corporate site to extract logos, favicons, imagery, and hero graphics.
- **Design Token Extraction:** The system analyzes computed styles to isolate the exact color palette (primary, secondary, accent codes) and typography.
- **Culture & Values Extraction:** AI parses textual content to isolate core mission statements and culture pillars.
- **Job Data Strategy:** The demo environment does not scrape live jobs; instead, it populates the UI with 10 sample jobs already present in the base product to showcase the interface.

## 3. Key AI Features & Functionality

The product leverages AI to transform the candidate journey from a passive search to an active, personalized engagement.

- **AI Recruiter Chatbot:** A conversational interface to guide candidates through the site and answer company-specific culture questions.
- **Skills Parsing & Resume Matching:** Candidates can upload a resume; the system parses their skills and provides instant job recommendations based on the sample job pool.
- **Personalized Alerts (Simulated Recruiter):** Instead of generic automated emails, the system generates alerts that simulate a recruiter reaching out directly to suggest a role, significantly increasing the application rate.

## 4. Cursor Engineering Instructions

When working in this repository, prioritize the following functional and architectural principles:

- **Visual Extraction Fidelity:** The priority is the high-fidelity extraction of brand elements. The code must ensure that the "look and feel" of the prospect's site is mirrored accurately in the demo.
- **Modular Visual Theming:** Maintain a strict separation between the layout and the theme. Components must consume extracted design tokens (colors, fonts, images) dynamically.
- **High Performance & Accessibility:** Public-facing structures must be highly performant and accessible (WCAG compliant).
- **Decoupled Data Layer:** The UI components should remain independent of the data source, allowing for easy transitions between mock data and future ATS integrations.

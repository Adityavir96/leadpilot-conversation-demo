# LeadPilot AI — Local Conversation Demo

A frontend-only React/Vite demo. It uses saved business settings, FAQ matching, keyword/synonym rules, lightweight conversation context, quick replies, and browser localStorage. It does **not** call Gemini, OpenAI, or any other AI API, and does not require an API key or backend.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). To create a static production build:

```bash
npm run build
npm run preview
```

Deploy the generated `dist/` folder to static hosting to share a public demo link.

## Demo flow

1. Open **Agent settings** and edit business name, industry, audience, services, description, welcome, questions, qualification rules, FAQs, and instructions.
2. FAQs use one entry per line: `question | answer | optional quick replies separated by semicolons`.
3. Click **Save configuration**.
4. Open **Chat playground** and test as a visitor.
5. Use **Share preview** to create a visitor-only URL with a snapshot of the current configuration.
6. Leads are stored locally in the browser and appear in the existing **Leads** page when captured in that same browser.

## Conversation intents covered

- Greeting, identity, thanks, goodbye
- Business profile, industry, audience, services
- Plans/packages, plan selection, plan-specific pricing and included features
- General pricing, fees, cost, budget and currency amounts
- Compare plans, recommendations, discounts and offers
- Process, getting started, onboarding and timelines
- Eligibility, requirements, goals, budget and lead qualification
- Location/address, payment methods, refunds/cancellation, reviews/portfolio
- Contacting a human/team
- Capturing name, email, phone, company, website, interest, budget and timeline
- Follow-up prompts that refer to the current topic, with selectable quick replies

## Important demo limitations

- This is deterministic rule-based logic, not a real language model. It can miss unusual phrasing or questions not covered by the saved knowledge.
- Sample business details and prices are demo data. Replace them before presenting the agent as representing a real company.
- Settings and leads are browser-local. A visitor on another device does not sync leads back to the admin dashboard.
- The visitor URL includes a snapshot of the setup; copy a fresh link after changing the settings.
- No email/webhook notifications, authentication, or shared database are connected.

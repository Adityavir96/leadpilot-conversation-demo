import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Bot, Check, ChevronDown, CircleHelp, Code2, Command, Copy, ExternalLink, Globe, LayoutDashboard, LifeBuoy, MessageCircle, MoreHorizontal, Plus, Send, Settings2, ShieldCheck, Sparkles, Target, Users, Zap } from 'lucide-react';
const DEFAULT_CONFIG = { business: 'BrightPath Digital', industry: 'Digital Marketing Agency', description: 'We help growing businesses generate more qualified leads with performance marketing, websites, and automation.', services: 'Performance marketing, Website development, AI automation', audience: 'Small and medium-sized businesses', qualification: 'Budget at or above ₹1,000 and project needed within 30 days', minBudget: '1000', timelineDays: '30', welcome: 'Hey! 👋 Welcome to BrightPath Digital. What can I help you figure out today?', tone: 'Friendly & professional', instructions: 'Sound casual, warm and helpful. Ask one question at a time. Use only saved business details; never invent prices, guarantees or policies. If a detail is missing, say so naturally and offer to pass the question to the team.', questions: 'What are you hoping to achieve?\nWhich service or plan are you interested in?\nWhat is your approximate budget?\nWhen are you hoping to get started?', visitorFields: 'name, email, phone, company, website', faqs: 'What services do you offer? | We offer performance marketing, website development, and AI automation. Which one are you exploring? | Performance marketing;Website development;AI automation\nWhat plans do you offer? | We have two demo plans. Which one would you like to explore? | Plan 1 - ₹1,000;Plan 2 - ₹2,000\nPlan 1 | Plan 1 costs ₹1,000. It is a sample demo price. Would you like to know what is included or explore another plan? | What is included?;Compare plans\nPlan 2 | Plan 2 costs ₹2,000. It is a sample demo price. Would you like to know what is included or explore another plan? | What is included?;Compare plans\nWhat is included in Plan 1? | Plan 1 includes the basic demo package. Edit this answer in Agent settings to match the real business.\nWhat is included in Plan 2? | Plan 2 includes the expanded demo package. Edit this answer in Agent settings to match the real business.\nHow much does it cost? | The demo plans start at ₹1,000. Final pricing depends on the plan and requirements.\nHow is pricing decided? | Pricing depends on the service, scope, and requirements.\nWho is this for? | We mainly help small and medium-sized businesses.\nHow does the process work? | First we understand your goals, then suggest a suitable service, confirm the scope, and arrange a team follow-up.\nHow long does it take? | Timing depends on the selected service and scope. The team can confirm an accurate timeline after learning about your needs.\nWhat are the requirements? | We review your goal, budget, and timeline to see whether the service is a good fit.\nDo you offer discounts? | No discount is listed in this demo. The team can confirm whether any current offer is available.\nWhat payment methods do you accept? | Payment options need to be confirmed by the team.\nCan I get a refund? | The refund policy is not configured in this demo. The team can clarify it before you make a decision.\nWhere are you located? | The business location has not been added to this demo yet. Please contact the team for location details.\nCan I speak to a person? | Absolutely. Share your name and best email or phone number and I can record your enquiry for the team.\nDo you have reviews or examples? | Case studies and testimonials have not been added to this demo yet. The team can share relevant examples.\nHow do I get started? | Tell me what you need and your ideal timeline, and I can capture the details for the team.', leadDestination: 'team@brightpath.example' };
const readStorage = (key, fallback) => { try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
}
catch {
    return fallback;
} };
function buildLocalDemoResponse(message, config, visitor, history = []) {
    const text = String(message || '').trim();
    const lower = text.toLowerCase();
    const updatedVisitor = { ...visitor };
    const norm = value => String(value || '').toLowerCase()
        .replace(/₹|rs\.?|inr/g, ' rupees ')
        .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
        .replace(/\b(plans|packages|services|offers|prices|costs|fees|charges)\b/g, w => ({ plans:'plan', packages:'package', services:'service', offers:'offer', prices:'price', costs:'cost', fees:'fee', charges:'charge' }[w]));
    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) updatedVisitor.email = emailMatch[0];
    const phoneMatch = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
    if (phoneMatch) updatedVisitor.phone = phoneMatch[0].trim();
    const nameMatch = text.match(/\b(?:my name is|i am|i'm|this is|name is)\s+([a-z][a-z '-]{1,40})/i);
    if (nameMatch && !/interested|looking|planning|from|want/i.test(nameMatch[1])) updatedVisitor.name = nameMatch[1].trim().replace(/[.!?,]+$/, '');

    const services = String(config.services || '').split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
    const matchedService = services.find(service => norm(lower).includes(norm(service)));
    if (matchedService) updatedVisitor.interest = matchedService;
    const budgetMatch = text.match(/(?:₹|rs\.?\s*)?\d[\d,]*(?:\.\d+)?\s*(?:k\b|thousand|lakh|lac|crore)?/i);
    const recentAssistantText = (history || []).slice(-3).filter(m => m.from === 'bot').map(m => m.text || '').join(' ').toLowerCase();
    if ((/\b(budget|cost|spend|price|pricing|afford|how much|₹|rs\.?|rupees)\b/i.test(text) || /budget|price|cost|how much/i.test(recentAssistantText)) && budgetMatch) updatedVisitor.budget = budgetMatch[0].trim();
    const timelineMatch = text.match(/\b(asap|immediately|right away|today|tomorrow|this week|next week|this month|next month|within\s+\d+\s*(?:days?|weeks?|months?)|\d+\s*(?:days?|weeks?|months?))\b/i);
    if (timelineMatch) updatedVisitor.timeline = timelineMatch[0];
    const companyMatch = text.match(/\b(?:my business is|we run|i run|company is|business type is)\s+([^.!?]{2,70})/i);
    if (companyMatch) updatedVisitor.company = companyMatch[1].trim();
    const businessTypeMatch = text.match(/\b(?:i have|i own|my company is a|i work at)\s+(?:a|an|the)?\s*([a-z][a-z &'-]{2,55}\b(?:business|store|shop|agency|clinic|salon|startup|company|restaurant|studio|firm))\b/i);
    if (businessTypeMatch && !updatedVisitor.company) updatedVisitor.company = businessTypeMatch[1].trim();
    const websiteMatch = text.match(/\b(?:https?:\/\/|www\.)[^\s]+/i);
    if (websiteMatch) updatedVisitor.website = websiteMatch[0];

    const faqs = String(config.faqs || '').split(/\n+/).map(line => {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        return { question: parts[0], answer: parts[1], options: (parts[2] || '').split(';').map(x => x.trim()).filter(Boolean) };
    }).filter(Boolean);
    const tokens = value => norm(value).split(' ').filter(w => w.length > 2 && !['the','and','for','you','what','tell','about','please','have','with','can','could','would','want','like','know','does','your','our','are','how','much','from','that','this','there','they','them','into','need'].includes(w));
    const msgTokens = tokens(text);
    const scoreFaq = faq => {
        const qTokens = tokens(faq.question);
        const overlap = qTokens.filter(w => msgTokens.includes(w)).length;
        const synonyms = [
            [['price','pricing','cost','fee','charge','rupees','money','expensive','cheap'], ['price','pricing','cost','fee','charge','amount','plan','package']],
            [['plan','package','subscription','tier','offer'], ['plan','package','subscription','tier','offer']],
            [['service','help','need','looking','provide'], ['service','help','need','looking','offer']],
            [['location','address','where','based'], ['location','address','where','based']],
            [['contact','call','email','phone','speak','human','team'], ['contact','call','email','phone','speak','team']],
        ];
        let bonus = 0;
        for (const [a,b] of synonyms) if (msgTokens.some(w=>a.includes(w)) && qTokens.some(w=>b.includes(w))) bonus += 1;
        return overlap + bonus;
    };
    const selectedPlanFaq = faqs.find(f => /\b(plan|package|tier)\s*[a-z0-9-]+\b/i.test(f.question) && norm(text).startsWith(norm(f.question)));
    const exactFaq = selectedPlanFaq || faqs.find(f => norm(f.question) === norm(text) || f.options.some(o => norm(o) === norm(text)));
    const sortedFaqs = faqs.map(f => ({ ...f, score: scoreFaq(f) })).sort((a,b)=>b.score-a.score);
    let matchingFaq = exactFaq || (sortedFaqs[0]?.score >= 1 ? sortedFaqs[0] : null);
    const historyText = (history || []).slice(-6).map(m => m.text || '').join(' ').toLowerCase();
    const contextText = `${visitor.contextTopic || ''} ${historyText}`.toLowerCase();
    const asksPlans = /\b(plan|package|subscription|pricing options|what do you offer|which options|options available)\b/i.test(lower);
    const asksPrice = /\b(price|pricing|cost|how much|budget|expensive|cheap|fee|charge|money|rupees|₹|rs\.?|rate)\b/i.test(lower);
    const asksService = /\b(service|services|offer|provide|do you do|what do you do|help with)\b/i.test(lower);
    const asksAbout = /\b(about|company|business|who are you|what are you|industry|which business|what business)\b/i.test(lower);
    const asksProcess = /\b(how does it work|process|steps|how it works|how to start|onboard|getting started)\b/i.test(lower);
    const asksTimeline = /\b(how long|timeline|duration|when|delivery|deliver|turnaround)\b/i.test(lower);
    const asksEligibility = /\b(eligible|eligibility|qualify|qualification|requirements|who can|suitable|fit for)\b/i.test(lower);
    const asksContact = /\b(contact|call me|email me|speak to someone|team|human|representative|phone number)\b/i.test(lower);
    const asksLocation = /\b(where|location|address|located|visit|map)\b/i.test(lower);
    const asksPayment = /\b(payment|pay|installment|instalment|refund|cancel|cancellation|money back|payment method)\b/i.test(lower);
    const asksComparison = /\b(compare|difference|better|versus|vs\b|which one|recommend|recommendation)\b/i.test(lower);
    const asksDiscount = /\b(discount|offer|deal|coupon|negotiate|cheaper)\b/i.test(lower);
    const asksTrust = /\b(review|testimonial|guarantee|proof|portfolio|case study|result|success rate)\b/i.test(lower);
    const greeting = /^(hi|hello|hey|hiya|good morning|good afternoon|good evening|yo|sup)\b/i.test(lower);
    const goodbye = /\b(bye|goodbye|that's all|that is all|see you)\b/i.test(lower);
    const thanks = /\b(thanks|thank you|thx|appreciate it)\b/i.test(lower);
    const vagueFollowup = /^(how much|and price|what about price|what about that|tell me more|more details|why|how|which one|that one|sounds good|okay|ok|yes|yeah|sure|go on|continue)\??[.! ]*$/i.test(lower);
    const plansFaq = faqs.find(f => /\b(plan|package|subscription)\b/i.test(f.question) && /\b(offer|available|which|what|plan|package)\b/i.test(f.question));
    const planEntries = faqs.filter(f => /\b(plan|package|tier)\s*[a-z0-9-]+\b/i.test(f.question) || f.options.length);
    const planOptions = plansFaq?.options?.length ? plansFaq.options : [...new Set(planEntries.map(f => f.question).filter(q => /\b(plan|package|tier)\s*[a-z0-9-]+\b/i.test(q)))];

    let reply = '';
    let options = [];
    let topic = visitor.contextTopic || '';
    if (greeting) {
        reply = `Hey${updatedVisitor.name ? ` ${updatedVisitor.name}` : ''}! 👋 Welcome to ${config.business || 'our business'}. What can I help you figure out today?`;
        topic = 'welcome';
    } else if (thanks) {
        reply = "You're welcome! 😊 Anything else you're curious about?";
    } else if (goodbye) {
        reply = `Thanks for checking out ${config.business || 'us'}! If anything else comes up, just drop a message.`;
    } else if (/\b(who are you|what are you|are you a bot|are you ai)\b/i.test(lower)) {
        reply = `I'm the ${config.business || 'business'} chat assistant. I can help with services, plans, pricing, and getting your enquiry to the right person.`;
        topic = 'about';
    } else if (exactFaq) {
        reply = exactFaq.answer;
        options = exactFaq.options;
        topic = exactFaq.question;
        if (/\b(plan|package|tier)\s*[a-z0-9-]+\b/i.test(exactFaq.question)) updatedVisitor.selectedPlan = exactFaq.question;
    } else if (asksPlans) {
        if (plansFaq) { reply = plansFaq.answer; options = plansFaq.options; }
        else if (planEntries.length) { reply = `We have a few options. Which one would you like to explore?`; options = planOptions; }
        else { reply = `I can help with pricing. ${config.description || ''} I don't have specific plan prices saved yet, but I can record what you're looking for so the team can advise.`.trim(); }
        topic = 'plans';
    } else if (asksPrice && (visitor.selectedPlan || /\b(plan|package|tier)\b/i.test(contextText))) {
        const chosen = visitor.selectedPlan || planEntries.find(f => norm(contextText).includes(norm(f.question)))?.question;
        const planFaq = chosen && faqs.find(f => norm(f.question) === norm(chosen));
        if (planFaq) reply = planFaq.answer;
        else if (matchingFaq && matchingFaq !== plansFaq) reply = matchingFaq.answer;
        else reply = `I can share the price once I know which option you mean. ${planOptions.length ? 'Which plan are you considering?' : 'Tell me the plan name and I’ll check the saved details.'}`;
        if (!planFaq && planOptions.length) options = planOptions;
        topic = chosen || 'pricing';
    } else if (asksPrice) {
        if (matchingFaq && /price|cost|fee|charge|pricing|budget/i.test(matchingFaq.question)) { reply = matchingFaq.answer; options = matchingFaq.options; topic = matchingFaq.question; }
        else { reply = `Happy to help with pricing! It depends on the option and what you need. ${planOptions.length ? 'Here are the available options — tap one to see its details.' : 'Tell me a little about what you need and I’ll guide you using the information we have.'}`; options = planOptions; topic = 'pricing'; }
    } else if (asksComparison && planOptions.length) {
        reply = `Sure — I can help compare them. Which options are you deciding between?`;
        options = planOptions;
        topic = 'plan comparison';
    } else if (asksDiscount) {
        reply = matchingFaq && /discount|offer|coupon/i.test(matchingFaq.question) ? matchingFaq.answer : `I don't want to promise a discount that isn't listed in the saved details. I can record your interest and the team can confirm any current offers.`;
        topic = 'discounts';
    } else if (asksPayment) {
        reply = matchingFaq && /payment|refund|cancel/i.test(matchingFaq.question) ? matchingFaq.answer : `I don't have a confirmed payment or refund policy saved here. Want me to note your question for the team?`;
        topic = 'payment policy';
    } else if (asksProcess) {
        reply = matchingFaq && /process|start|work|step|onboard/i.test(matchingFaq.question) ? matchingFaq.answer : `Usually the next step is to understand what you need, confirm the best-fit service and budget, and have the team follow up. ${config.questions ? 'I can ask a couple of quick questions to understand your requirements.' : ''}`;
        topic = 'process';
    } else if (asksTimeline) {
        reply = matchingFaq && /time|timeline|duration|delivery/i.test(matchingFaq.question) ? matchingFaq.answer : `Timing depends on the service and scope. ${config.timelineDays ? `For this demo, the qualification window is ${config.timelineDays} days.` : ''} When are you hoping to get started?`.trim();
        topic = 'timeline';
    } else if (asksEligibility) {
        reply = matchingFaq && /eligib|qualif|requirement|suitable/i.test(matchingFaq.question) ? matchingFaq.answer : `A good fit depends on your requirements, budget, and timing. Our current qualification guide is: ${config.qualification || 'we review each enquiry individually'}. What are you hoping to achieve?`;
        topic = 'eligibility';
    } else if (asksLocation) {
        reply = matchingFaq && /location|address|where/i.test(matchingFaq.question) ? matchingFaq.answer : `I don't have a verified address saved in the business details yet. I can pass your question to the team if you'd like.`;
        topic = 'location';
    } else if (asksTrust) {
        reply = matchingFaq && /review|testimonial|guarantee|portfolio|case study|result/i.test(matchingFaq.question) ? matchingFaq.answer : `I don't want to make up reviews or guarantees. If you share what you'd like to see, I can note it for the team.`;
        topic = 'proof';
    } else if (asksContact) {
        reply = `Of course — I can pass your enquiry to the team. What's the best name and email address or phone number to reach you?`;
        topic = 'contact';
    } else if (asksAbout) {
        reply = `${config.business || 'Our business'}${config.industry ? ` works in ${config.industry}` : ''}. ${config.description || ''} We mainly help ${config.audience || 'our customers'}${config.services ? ` with ${config.services}` : ''}.`.trim();
        topic = 'about';
    } else if (asksService) {
        reply = config.services ? `We can help with ${config.services}. Which of those sounds closest to what you need?` : (config.description || 'Tell me what you are looking for and I’ll help with your enquiry.');
        options = services.slice(0, 5);
        topic = 'services';
    } else if (matchedService) {
        reply = `Got it — ${matchedService}! 😊 ${config.description || ''} Are you looking for pricing, what's included, or help choosing the right option?`.trim();
        options = ['Pricing', 'What is included?', 'Help me choose'];
        topic = matchedService;
    } else if (matchingFaq) {
        reply = matchingFaq.answer;
        options = matchingFaq.options;
        topic = matchingFaq.question;
    } else if (vagueFollowup && /plan|pricing|package|tier/.test(contextText)) {
        if (/price|how much/.test(lower)) {
            const chosen = visitor.selectedPlan || planEntries.find(f => norm(contextText).includes(norm(f.question)))?.question;
            const planFaq = chosen && faqs.find(f => norm(f.question) === norm(chosen));
            reply = planFaq ? planFaq.answer : `Which plan should I check the price for?`;
            options = planFaq ? planFaq.options : planOptions;
            topic = chosen || 'pricing';
        } else { reply = `Sure! Which part would you like to know more about?`; options = ['Pricing', 'What is included?', 'Compare plans']; }
    } else if (updatedVisitor.email || updatedVisitor.phone) {
        reply = `Thanks for sharing that${updatedVisitor.name ? `, ${updatedVisitor.name}` : ''}! I've got your contact detail. What service or plan are you interested in, and when are you hoping to get started?`;
        topic = 'lead capture';
    } else if (updatedVisitor.interest) {
        reply = `Got it — you're interested in ${updatedVisitor.interest}. 😊 Would you like to explore pricing, what's included, or how to get started?`;
        options = ['Pricing', 'What is included?', 'How do I get started?'];
        topic = updatedVisitor.interest;
    } else {
        reply = `Got you! 😊 ${config.description || `I can help you learn about ${config.business || 'our business'}.`} Are you mainly looking for information about services, plans and pricing, or something else?`.trim();
        options = ['Services', 'Plans & pricing', 'Talk to the team'];
        topic = 'general enquiry';
    }
    return { reply, visitor: updatedVisitor, options, topic };
}

function App() {
    const visitorMode = new URLSearchParams(window.location.search).get('view') === 'chat';
    const [page, setPage] = useState(() => visitorMode ? 'playground' : 'overview');
    const [config, setConfig] = useState(() => { try {
        const encoded = new URLSearchParams(window.location.search).get('config');
        if (visitorMode && encoded)
            return JSON.parse(decodeURIComponent(escape(atob(encoded))));
    }
    catch { } return readStorage('lp-config', DEFAULT_CONFIG); });
    const [leads, setLeads] = useState(() => readStorage('lp-leads', []));
    const [saved, setSaved] = useState(false);
    const [chat, setChat] = useState(() => [{ from: 'bot', text: config.welcome || DEFAULT_CONFIG.welcome }]);
    const [draft, setDraft] = useState('');
    const [visitor, setVisitor] = useState({ name: '', email: '', phone: '', interest: '', budget: '', timeline: '', answers: [] });
    const [step, setStep] = useState(0);
    const [busy, setBusy] = useState(false);
    const [leadSaved, setLeadSaved] = useState(false);
    const [savedLeadId, setSavedLeadId] = useState(null);
    const [notice, setNotice] = useState('');
    const [copied, setCopied] = useState(false);
    useEffect(() => { localStorage.setItem('lp-config', JSON.stringify(config)); }, [config]);
    useEffect(() => { localStorage.setItem('lp-leads', JSON.stringify(leads)); }, [leads]);
    useEffect(() => { if (notice) {
        const id = setTimeout(() => setNotice(''), 2600);
        return () => clearTimeout(id);
    } }, [notice]);
    const qualified = leads.filter(l => l.status === 'Qualified').length;
    const scoreAvg = leads.length ? Math.round(leads.reduce((a, l) => a + l.score, 0) / leads.length) : 0;
    const nav = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'agent', label: 'Agent settings', icon: Bot },
        { id: 'playground', label: 'Chat playground', icon: MessageCircle },
        { id: 'leads', label: 'Leads', icon: Users },
    ];
    function updateConfig(key, value) { setConfig(c => ({ ...c, [key]: value })); setSaved(false); }
    function saveConfig() { localStorage.setItem('lp-config', JSON.stringify(config)); setSaved(true); setNotice('Agent settings saved'); }
    async function sendMessage(e, selectedText) {
        e?.preventDefault();
        const text = String(selectedText ?? draft).trim();
        if (!text || busy)
            return;
        const nextChat = [...chat, { from: 'user', text }];
        setDraft('');
        setChat(nextChat);
        setBusy(true);
        try {
            // Local demo mode: no API request, Gemini key, or backend required.
            const data = buildLocalDemoResponse(text, config, visitor, chat);
            const updatedVisitor = { ...visitor };
            for (const key of ['name', 'email', 'phone', 'interest', 'budget', 'timeline', 'company', 'website']) {
                const value = data.visitor[key];
                if (typeof value === 'string' && value.trim())
                    updatedVisitor[key] = value.trim();
            }
            // Keep an answer log for the dashboard, without forcing a question sequence.
            updatedVisitor.contextTopic = data.topic || visitor.contextTopic || '';
            updatedVisitor.answers = [
                ...(visitor.answers || []),
                { question: chat.length ? chat[chat.length - 1].text : 'Visitor message', answer: text },
            ];
            setVisitor(updatedVisitor);
            const budgetText = String(updatedVisitor.budget || '').toLowerCase().replace(/,/g, '');
            const budgetMatch = budgetText.match(/\d+(?:\.\d+)?/);
            let budgetValue = budgetMatch ? Number(budgetMatch[0]) : null;
            if (budgetValue !== null) {
                if (/crore|\bcr\b/.test(budgetText))
                    budgetValue *= 10000000;
                else if (/lakh|lac/.test(budgetText))
                    budgetValue *= 100000;
                else if (/k\b/.test(budgetText))
                    budgetValue *= 1000;
            }
            const timelineText = String(updatedVisitor.timeline || '').toLowerCase();
            let timelineDays = null;
            if (/asap|immediately|right away|today/.test(timelineText))
                timelineDays = 0;
            else if (/tomorrow/.test(timelineText))
                timelineDays = 1;
            else if (/this week/.test(timelineText))
                timelineDays = 7;
            else if (/next week/.test(timelineText))
                timelineDays = 14;
            else if (/this month/.test(timelineText))
                timelineDays = 30;
            else if (/next month/.test(timelineText))
                timelineDays = 60;
            else {
                const timeMatch = timelineText.match(/(\d+(?:\.\d+)?)\s*(day|week|month)/);
                if (timeMatch) {
                    const amount = Number(timeMatch[1]);
                    timelineDays = timeMatch[2] === 'month' ? amount * 30 : timeMatch[2] === 'week' ? amount * 7 : amount;
                }
            }
            const minimumBudget = Number(config.minBudget || 0);
            const maximumDays = Number(config.timelineDays || 0);
            const budgetKnown = budgetValue !== null;
            const timelineKnown = timelineDays !== null;
            const budgetPass = minimumBudget <= 0 || (budgetKnown && budgetValue >= minimumBudget);
            const timelinePass = maximumDays <= 0 || (timelineKnown && timelineDays <= maximumDays);
            const qualifiedLead = budgetPass && timelinePass && (minimumBudget <= 0 || budgetKnown) && (maximumDays <= 0 || timelineKnown);
            // Save once a visitor has shared a real contact method and some business intent.
            // Never require every configured field before the conversation can proceed.
            const hasContact = Boolean(updatedVisitor.email || updatedVisitor.phone);
            const hasIntent = Boolean(updatedVisitor.interest || updatedVisitor.budget || updatedVisitor.timeline);
            let reply = data.reply.trim();
            if (!leadSaved && hasContact && hasIntent) {
                const email = String(updatedVisitor.email || '').trim();
                const phone = String(updatedVisitor.phone || '').trim();
                const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                const validPhone = phone.replace(/\D/g, '').length >= 7;
                if (validEmail || validPhone) {
                    const id = Date.now();
                    const lead = {
                        id,
                        name: updatedVisitor.name || updatedVisitor.company || 'Website visitor',
                        email,
                        phone,
                        company: updatedVisitor.company || '',
                        website: updatedVisitor.website || '',
                        interest: updatedVisitor.interest || 'General enquiry',
                        budget: updatedVisitor.budget || '',
                        timeline: updatedVisitor.timeline || '',
                        answers: updatedVisitor.answers || [],
                        score: qualifiedLead ? 85 : 55,
                        status: qualifiedLead ? 'Qualified' : 'Review',
                        qualification: {
                            qualified: qualifiedLead,
                            minimumBudget,
                            budgetValue,
                            maximumDays,
                            timelineDays,
                        },
                        time: new Date().toLocaleString(),
                        destination: config.leadDestination || '',
                    };
                    setLeads(current => [lead, ...current]);
                    setLeadSaved(true);
                    setSavedLeadId(id);
                    setStep(3);
                    setNotice('Lead saved in this browser');
                }
            }
            else if (savedLeadId) {
                // Keep the existing lead current if the visitor adds details later.
                setLeads(current => current.map(lead => lead.id === savedLeadId ? {
                    ...lead,
                    name: updatedVisitor.name || updatedVisitor.company || lead.name,
                    email: updatedVisitor.email || lead.email,
                    phone: updatedVisitor.phone || lead.phone,
                    company: updatedVisitor.company || lead.company,
                    website: updatedVisitor.website || lead.website,
                    interest: updatedVisitor.interest || lead.interest,
                    budget: updatedVisitor.budget || lead.budget,
                    timeline: updatedVisitor.timeline || lead.timeline,
                    answers: updatedVisitor.answers || lead.answers,
                } : lead));
            }
            const progress = ['interest', 'budget', 'timeline'].filter(key => updatedVisitor[key]).length;
            if (!leadSaved)
                setStep(current => Math.max(current, progress));
            setChat(current => [...current, { from: 'bot', text: reply || 'How else can I help?', options: data.options || [] }]);
        }
        catch (error) {
            console.error('Local demo chat error:', error);
            setChat(current => [...current, {
                    from: 'bot',
                    text: 'Sorry, I couldn’t connect just now. Please try again in a moment.',
                }]);
            setNotice('Something went wrong in local demo mode.');
        }
        finally {
            setBusy(false);
        }
    }
    function resetChat() {
        setChat([{ from: 'bot', text: config.welcome || DEFAULT_CONFIG.welcome }]);
        setStep(0);
        setVisitor({ name: '', email: '', phone: '', interest: '', budget: '', timeline: '', company: '', website: '', selectedPlan: '', contextTopic: '', answers: [] });
        setLeadSaved(false);
        setSavedLeadId(null);
        setDraft('');
    }
    async function copyPreviewLink() {
        const url = new URL(window.location.href);
        url.search = '';
        url.searchParams.set('view', 'chat');
        url.searchParams.set('config', btoa(unescape(encodeURIComponent(JSON.stringify(config)))));
        try {
            await navigator.clipboard.writeText(url.toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        }
        catch {
            window.prompt('Copy this preview URL:', url.toString());
        }
    }
    const pageTitle = nav.find(n => n.id === page)?.label || 'Overview';
    return <div className={'app-shell ' + (visitorMode ? 'visitor-mode' : '')}>
    {!visitorMode && <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Sparkles size={19}/></div><div><strong>leadpilot<span> AI</span></strong><small>AGENT STUDIO</small></div></div>
      <div className="workspace"><div className="workspace-logo">B</div><div className="workspace-name"><strong>{config.business}</strong><small>Free workspace</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(n => <button key={n.id} className={'nav-item ' + (page === n.id ? 'active' : '')} onClick={() => setPage(n.id)}><n.icon size={17}/><span>{n.label}</span>{n.id === 'leads' && <em>{leads.length}</em>}</button>)}</nav>
      <div className="nav-label tools-label">TOOLS</div>
      <button className="nav-item" onClick={() => setNotice('Knowledge base demo — configure FAQs in agent settings')}><CircleHelp size={17}/><span>Knowledge base</span></button>
      <button className="nav-item" onClick={() => setNotice('Integrations are shown as a demo preview')}><Code2 size={17}/><span>Integrations</span><span className="soon">SOON</span></button>
      <div className="sidebar-bottom"><div className="usage-card"><div className="usage-icon"><Zap size={15}/></div><div className="usage-copy"><strong>Free plan</strong><small>Demo environment</small></div><div className="usage-dots"><i /><i /><i /></div><div className="usage-track"><span /></div><small className="usage-foot">Demo data stored in this browser</small></div><button className="profile" onClick={() => setNotice('Profile settings are not connected in this prototype')}><div className="avatar">BG</div><div><strong><Batool></Batool></strong><small>Admin</small></div><MoreHorizontal size={18}/></button></div>
    </aside>}
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="slash">/</span><strong>{pageTitle}</strong></div><div className="top-actions"><div className="status-pill"><span /> {visitorMode ? 'Visitor preview' : 'Prototype workspace'}</div><button className="icon-btn" title="Help" onClick={() => setNotice('LeadPilot AI demo workspace')}><LifeBuoy size={17}/></button><div className="top-avatar">BG</div></div></header>
      <div className="content">
        {page === 'overview' && <>
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR AI WORKSPACE</div><h1>Good evening, Bhavesh <span className="wave">✳</span></h1><p>Here’s what’s happening with your AI agent today.</p></div><button className="primary-btn" onClick={() => setPage('agent')}><Plus size={17}/> Configure agent</button></div>
          <div className="hero-card"><div className="hero-content"><div className="hero-chip"><Sparkles size={13}/> YOUR AI, YOUR RULES</div><h2>Turn conversations into<br /><span>customers.</span></h2><p>Your AI agent is ready to qualify leads, answer questions, and help your business grow — around the clock.</p><div className="hero-buttons"><button className="hero-btn" onClick={() => setPage('playground')}>Try your agent <ArrowUpRight size={16}/></button><button className="hero-link" onClick={() => setPage('agent')}>Customize agent <ArrowDownRight size={15}/></button></div></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-glow"/><div className="bot-illustration"><div className="bot-antenna"/><div className="bot-head"><div className="bot-ear left"/><div className="bot-ear right"/><div className="bot-eye eye-left"/><div className="bot-eye eye-right"/><div className="bot-mouth"/></div><div className="bot-body"><div className="bot-badge"><Sparkles size={20}/></div></div></div><div className="float-card float-card-top"><span className="float-icon"><MessageCircle size={14}/></span><span><strong>New conversation</strong><small>Visitor is engaging</small></span><i /></div><div className="float-card float-card-bottom"><span className="float-icon green"><Target size={14}/></span><span><strong>Lead qualified!</strong><small>Score: 92/100</small></span><Check size={15} className="float-check"/></div></div><div className="hero-noise"/></div>
          <div className="section-title-row"><div><h2>Performance overview</h2><p>Your agent's activity at a glance.</p></div><button className="range-btn">Last 30 days <ChevronDown size={14}/></button></div>
          <div className="stats-grid"><Stat icon={Users} label="Total leads" value={String(leads.length).padStart(2, '0')} delta="Captured in demo" color="purple"/><Stat icon={Target} label="Qualified leads" value={String(qualified).padStart(2, '0')} delta={leads.length ? `${Math.round(qualified / leads.length * 100)}% qualification rate` : 'No leads yet'} color="green"/><Stat icon={MessageCircle} label="Conversations" value="—" delta="Session tracking not connected" color="blue"/><Stat icon={Activity} label="Avg. lead score" value={String(scoreAvg || 0)} delta="Out of 100 points" color="orange"/></div>
          <div className="lower-grid"><section className="panel activity-panel"><div className="panel-head"><div><h3>Recent leads</h3><p>Latest visitors captured by your agent</p></div><button className="text-btn" onClick={() => setPage('leads')}>View all <ArrowUpRight size={14}/></button></div><LeadTable leads={leads.slice(0, 4)}/></section><section className="panel agent-panel"><div className="panel-head"><div><h3>Your AI agent</h3><p>Current agent status</p></div><span className="live-pill"><i /> LIVE DEMO</span></div><div className="agent-summary"><div className="agent-orb"><Bot size={27}/><span /></div><div><strong>{config.business} Assistant</strong><p>{config.industry}</p></div><button className="dots-btn" onClick={() => setPage('agent')}><MoreHorizontal size={19}/></button></div><div className="agent-meta"><div><span>Personality</span><strong>{config.tone}</strong></div><div><span>Lead qualification</span><strong className="enabled"><Check size={13}/> Enabled</strong></div><div><span>Knowledge base</span><strong>Business profile</strong></div></div><button className="outline-wide" onClick={() => setPage('agent')}><Settings2 size={15}/> Manage agent settings <ArrowUpRight size={14}/></button></section></div>
        </>}
        {page === 'agent' && <><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> AGENT CONFIGURATION</div><h1>Make it your own.</h1><p>Give your agent the context it needs to represent your business.</p></div><button className="primary-btn" onClick={saveConfig}><Check size={16}/>{saved ? 'Saved' : 'Save changes'}</button></div><div className="settings-layout"><section className="panel settings-panel"><div className="settings-title"><div className="settings-icon purple-bg"><Globe size={19}/></div><div><h3>Business profile</h3><p>Basic information your agent uses in conversations.</p></div></div><div className="form-grid"><Field label="Business name"><input value={config.business} onChange={e => updateConfig('business', e.target.value)} placeholder="e.g. BrightPath Digital"/></Field><Field label="Industry"><input value={config.industry} onChange={e => updateConfig('industry', e.target.value)} placeholder="e.g. Marketing"/></Field><Field label="Target audience"><input value={config.audience} onChange={e => updateConfig('audience', e.target.value)}/></Field><Field label="Services offered"><input value={config.services} onChange={e => updateConfig('services', e.target.value)}/></Field><Field label="Business description" wide><textarea rows="3" value={config.description} onChange={e => updateConfig('description', e.target.value)}/></Field></div><div className="settings-divider"/><div className="settings-title"><div className="settings-icon blue-bg"><MessageCircle size={19}/></div><div><h3>Conversation behavior</h3><p>Set the way your agent talks to potential customers.</p></div></div><div className="form-grid"><Field label="Agent personality"><select value={config.tone} onChange={e => updateConfig('tone', e.target.value)}><option>Friendly & professional</option><option>Concise & direct</option><option>Warm & consultative</option><option>Formal & enterprise</option></select></Field><Field label="Lead qualification criteria"><input value={config.qualification} onChange={e => updateConfig('qualification', e.target.value)}/></Field><Field label="Welcome message" wide><textarea rows="3" value={config.welcome} onChange={e => updateConfig('welcome', e.target.value)}/></Field></div><div className="settings-divider"/><div className="settings-title"><div className="settings-icon purple-bg"><Target size={19}/></div><div><h3>Qualification and lead capture</h3><p>Define what the agent asks, what it collects, and how it evaluates fit.</p></div></div><div className="form-grid"><Field label="Minimum budget (numeric, same currency)"><input type="number" min="0" value={config.minBudget || ''} onChange={e => updateConfig('minBudget', e.target.value)} placeholder="25000"/></Field><Field label="Target timeline in days"><input type="number" min="0" value={config.timelineDays || ''} onChange={e => updateConfig('timelineDays', e.target.value)} placeholder="30"/></Field><Field label="Visitor information to collect (comma-separated)" wide><input value={config.visitorFields || ''} onChange={e => updateConfig('visitorFields', e.target.value)} placeholder="name, email, phone, company"/></Field><Field label="Questions to ask (one per line)" wide><textarea rows="4" value={config.questions || ''} onChange={e => updateConfig('questions', e.target.value)} placeholder={'What service are you interested in?\nWhat is your budget?\nWhen do you need to start?'}/></Field><Field label="FAQs / knowledge (one per line: question | answer | optional buttons separated by semicolons)" wide><textarea rows="4" value={config.faqs || ''} onChange={e => updateConfig('faqs', e.target.value)} placeholder="What plans do you offer? | We have two plans. Which one do you want? | Plan 1 - ₹1,000; Plan 2 - ₹2,000"/></Field><Field label="Agent instructions" wide><textarea rows="3" value={config.instructions || ''} onChange={e => updateConfig('instructions', e.target.value)} placeholder="How should the agent behave?"/></Field><Field label="Lead destination (email/webhook to configure later)" wide><input value={config.leadDestination || ''} onChange={e => updateConfig('leadDestination', e.target.value)} placeholder="sales@yourcompany.com"/></Field></div><div className="settings-footer"><span><ShieldCheck size={15}/> Prototype settings save in this browser</span><button className="primary-btn" onClick={saveConfig}>{saved ? <Check size={16}/> : null}{saved ? 'Saved successfully' : 'Save configuration'}</button></div></section><aside className="panel preview-panel"><div className="panel-head"><div><h3>Agent preview</h3><p>See your configuration at a glance.</p></div><span className="live-pill"><i /> READY</span></div><div className="preview-card"><div className="preview-cover"><div className="preview-stars">✦　✧　✦</div><div className="preview-bot"><Bot size={28}/></div></div><div className="preview-info"><span className="preview-tag">AI ASSISTANT</span><h3>{config.business || 'Your business'}</h3><p>{config.description}</p><div className="preview-details"><span><MessageCircle size={14}/>{config.tone}</span><span><Target size={14}/>Lead scoring enabled</span></div><button className="outline-wide" onClick={() => { setPage('playground'); resetChat(); }}>Test conversation <ArrowUpRight size={14}/></button></div></div><div className="tip-box"><Sparkles size={16}/><div><strong>Pro tip</strong><p>Specific services and qualification criteria help the demo agent guide visitors more effectively.</p></div></div></aside></div></>}
        {page === 'playground' && <><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> LIVE PREVIEW</div><h1>Meet your AI agent.</h1><p>Test a visitor conversation and see how leads are captured.</p></div><button className="outline-btn" onClick={resetChat}>Reset conversation</button></div><div className="playground-layout"><section className="panel chat-panel"><div className="chat-top"><div className="chat-brand-icon"><Bot size={21}/></div><div><strong>{config.business} Assistant</strong><span><i /> Typically replies instantly</span></div><button className="dots-btn" onClick={resetChat}><MoreHorizontal size={20}/></button></div><div className="chat-context"><Sparkles size={14}/> Local demo assistant using your business settings <span>AI</span></div><div className="chat-messages">{chat.map((m, i) => <div className={'message-row ' + m.from} key={i}>{m.from === 'bot' && <div className="message-avatar"><Bot size={15}/></div>}<div className="message-bubble">{m.text}{m.from === 'bot' && m.options?.length > 0 && <div className="message-options">{m.options.map(option => <button type="button" key={option} onClick={() => sendMessage(undefined, option)} disabled={busy}>{option}</button>)}</div>}<small>{m.from === 'bot' ? 'LeadPilot' : 'You'} · {i === 0 ? 'Now' : `${Math.max(1, i)}m`}</small></div></div>)}{leadSaved && <div className="capture-success"><Check size={17}/><div><strong>Lead captured successfully</strong><span>See it in the Leads section.</span></div></div>}</div><form className="chat-compose" onSubmit={sendMessage}><input value={draft} onChange={e => setDraft(e.target.value)} placeholder={busy ? 'Thinking...' : leadSaved ? 'Continue the conversation...' : 'Ask a question or describe what you need...'} disabled={busy}/><button type="submit" disabled={!draft.trim() || busy} aria-label="Send message">{busy ? '…' : <Send size={17}/>}</button></form><div className="chat-disclaimer">Rule-based demo conversation · Lead records are saved in this browser.</div></section><aside className="panel chat-side"><h3>Conversation insights</h3><p className="side-sub">Live visitor qualification</p><div className="score-circle"><div><strong>{leadSaved ? (leads.find(l => l.id === savedLeadId)?.score || 85) : Math.min(75, step * 18 + 12)}</strong><span>LEAD SCORE</span></div></div><div className="score-caption"><span className="score-dot"/> {leadSaved ? 'Lead captured' : 'Understanding visitor needs'}</div><div className="checklist"><div className={step >= 1 ? 'done' : ''}><span>{step >= 1 ? <Check size={12}/> : 1}</span><div><strong>Understand needs</strong><small>Identify service interest</small></div></div><div className={step >= 2 ? 'done' : ''}><span>{step >= 2 ? <Check size={12}/> : 2}</span><div><strong>Qualify lead</strong><small>Budget and timeline</small></div></div><div className={leadSaved ? 'done' : ''}><span>{leadSaved ? <Check size={12}/> : 3}</span><div><strong>Capture contact</strong><small>Name and email</small></div></div><div className={leadSaved ? 'done' : ''}><span>{leadSaved ? <Check size={12}/> : 4}</span><div><strong>Save lead</strong><small>Available in dashboard</small></div></div></div><button className="outline-wide" onClick={() => setPage('agent')}><Settings2 size={15}/> Edit agent instructions</button></aside></div></>}
        {page === 'leads' && <><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> LEAD MANAGEMENT</div><h1>Every lead, in one place.</h1><p>Review and manage the contacts captured by your agent.</p></div><button className="primary-btn" onClick={() => { const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'leadpilot-leads.json'; a.click(); URL.revokeObjectURL(url); }}><ArrowDownRight size={16}/> Export leads</button></div><div className="stats-grid lead-stats"><Stat icon={Users} label="All leads" value={String(leads.length).padStart(2, '0')} delta="All captured contacts" color="purple"/><Stat icon={Target} label="Qualified" value={String(qualified).padStart(2, '0')} delta="Ready for follow-up" color="green"/><Stat icon={Activity} label="Needs review" value={String(leads.filter(l => l.status !== 'Qualified').length).padStart(2, '0')} delta="Review manually" color="orange"/><Stat icon={ShieldCheck} label="Avg. score" value={String(scoreAvg || 0)} delta="Lead quality score" color="blue"/></div><section className="panel all-leads"><div className="panel-head"><div><h3>All leads</h3><p>Contacts and qualification status</p></div><span className="count-pill">{leads.length} records</span></div><LeadTable leads={leads} detailed onDelete={id => setLeads(ls => ls.filter(l => l.id !== id))}/>{leads.length === 0 && <div className="empty-state"><Users size={28}/><strong>No leads yet</strong><p>Try a conversation in the chat playground to capture your first lead.</p><button className="primary-btn" onClick={() => setPage('playground')}>Open chat playground</button></div>}</section><p className="storage-note"><ShieldCheck size={14}/> Prototype leads are stored in this browser only; destination delivery requires a backend integration.</p></>}
      </div>
      <footer className="footer"><span>© 2026 LeadPilot AI <i /> Built for smarter conversations.</span><span><span className="footer-status"/> {visitorMode ? 'Visitor preview' : 'Prototype environment'} <button onClick={copyPreviewLink}>{copied ? <Check size={12}/> : <Copy size={12}/>} {copied ? 'Copied' : 'Share preview'}</button></span></footer>
    </main>
    {notice && <div className="toast"><Check size={16}/>{notice}</div>}
  </div>;
}
function Stat({ icon: Icon, label, value, delta, color }) { return <div className="stat-card"><div className="stat-top"><div className={'stat-icon ' + color}><Icon size={18}/></div><span className="stat-period">30D <ArrowUpRight size={12}/></span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-delta">{delta}</div></div>; }
function Field({ label, wide, children }) { return <label className={'field ' + (wide ? 'wide' : '')}><span>{label}</span>{children}</label>; }
function LeadTable({ leads, detailed = false, onDelete }) { return <div className="table-scroll"><table><thead><tr><th>CONTACT</th><th>INTEREST</th><th>SCORE</th><th>STATUS</th>{detailed && <th>ADDED</th>}{detailed && <th />}</tr></thead><tbody>{leads.map((l, i) => <tr key={l.id}><td><div className="lead-person"><div className={'lead-avatar avatar-' + (i % 4)}>{(l.name || 'V').split(' ').map(x => x[0]).join('').slice(0, 2)}</div><div><strong>{l.name}</strong><small>{l.email}</small></div></div></td><td><span className="interest-text">{l.interest}</span></td><td><div className="score-cell"><div className="score-track"><span style={{ width: `${l.score}%` }}/></div><strong>{l.score}</strong></div></td><td><span className={'lead-status ' + (l.status === 'Qualified' ? 'qualified' : 'review')}><i />{l.status}</span></td>{detailed && <td><span className="added-time">{l.time}</span></td>}{detailed && <td><button className="row-action" title="Remove lead" onClick={() => onDelete?.(l.id)}><MoreHorizontal size={17}/></button></td>}</tr>)}</tbody></table>{leads.length === 0 && null}</div>; }
export default App;

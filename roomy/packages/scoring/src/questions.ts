import type { Section, Question } from './types.js';

export const SECTIONS: Section[] = [
  { id: 'sleep',    label: 'Sleep & Schedule',          emoji: '🌙', count: 6 },
  { id: 'clean',    label: 'Cleanliness & Space',        emoji: '🧹', count: 7 },
  { id: 'finance',  label: 'Finance & Expenses',         emoji: '💸', count: 6 },
  { id: 'social',   label: 'Social Habits & Guests',     emoji: '🏠', count: 7 },
  { id: 'conflict', label: 'Conflict & Communication',   emoji: '🗣️', count: 5 },
  { id: 'culture',  label: 'Culture, Values & Identity', emoji: '🪔', count: 5 },
];

export const QUESTIONS: Question[] = [
  // ─── SECTION 1: SLEEP & SCHEDULE ─────────────────────────────────────────
  {
    id: 'q1', section: 'sleep', dimension: 'sleep',
    type: 'scenario_choice',
    text: "It's a Tuesday night. What are you most likely doing at 11:30 PM?",
    hint: "Pick the option closest to your usual reality — not your ideal.",
    options: [
      { label: 'Already asleep or winding down', value: 1 },
      { label: 'Just finished dinner, watching something light', value: 2 },
      { label: 'Working / studying, getting into focus mode', value: 3 },
      { label: 'Chatting with friends online or going out', value: 4 },
      { label: 'Just starting my most productive hours', value: 5 },
    ],
  },
  {
    id: 'q2', section: 'sleep', dimension: 'sleep',
    type: 'scenario_choice',
    text: "Your flatmate texts: \"Hey, having people over tonight till maybe 1am, okay?\" It's 8 PM. What's your gut reaction?",
    options: [
      { label: "That's fine, I'll join for a bit", value: 1 },
      { label: "Fine, as long as they're quiet by 11", value: 2 },
      { label: "A bit annoyed — I'd prefer more notice or no guests on weeknights", value: 3 },
      { label: "Very frustrated — this is exactly what I moved in trying to avoid", value: 4 },
    ],
  },
  {
    id: 'q3', section: 'sleep', dimension: 'sleep',
    type: 'slider',
    text: 'What time do you typically wake up on workdays / college days?',
    hint: 'Slide to your usual wake-up time',
    min: 5, max: 11, step: 0.5,
    labels: ['5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM'],
    default: 7.5,
  },
  {
    id: 'q4', section: 'sleep', dimension: 'sleep',
    type: 'slider',
    text: 'What time do you usually go to sleep on most nights?',
    min: 21, max: 30, step: 0.5,
    labels: ['9 PM', '10 PM', '11 PM', '12 AM', '1 AM', '2 AM', '3 AM', '4 AM+'],
    default: 23.5,
    hint: "Be honest — \"should sleep\" vs \"actually sleep\"",
  },
  {
    id: 'q5', section: 'sleep', dimension: 'sleep',
    type: 'scenario_choice',
    text: 'Your flatmate accidentally slams a cabinet door at 7 AM on a Saturday. What\'s your honest response?',
    options: [
      { label: "I'm already up — no big deal", value: 1 },
      { label: "Slightly annoyed but I'd let it go", value: 2 },
      { label: "Annoyed and I'd mention it later", value: 3 },
      { label: "Really upset — weekends are sacred sleep time", value: 4 },
    ],
  },
  {
    id: 'q6', section: 'sleep', dimension: 'sleep',
    type: 'scenario_choice',
    text: 'How would you describe your schedule consistency?',
    options: [
      { label: 'Very consistent — same time every day, weekday or weekend', value: 1 },
      { label: 'Mostly consistent with ±1 hour variation', value: 2 },
      { label: 'Consistent on weekdays, very different on weekends', value: 3 },
      { label: 'Erratic — depends entirely on work, mood, events', value: 4 },
    ],
  },

  // ─── SECTION 2: CLEANLINESS & SPACE ──────────────────────────────────────
  {
    id: 'q7', section: 'clean', dimension: 'clean',
    type: 'scenario_choice',
    text: 'Someone visits your room without warning. What would they see?',
    hint: 'Answer honestly — not aspirationally.',
    options: [
      { label: 'Spotless. I clean proactively before it gets messy', value: 1 },
      { label: 'Organised with minor clutter — guest-ready in 5 minutes', value: 2 },
      { label: "Lived-in. Clothes on chair, desk cluttered, but I know where everything is", value: 3 },
      { label: 'Needs a 30-minute session before anyone should see it', value: 4 },
      { label: "Honestly, I've stopped noticing the mess", value: 5 },
    ],
  },
  {
    id: 'q8', section: 'clean', dimension: 'clean',
    type: 'slider',
    text: 'How often should the common kitchen be cleaned (counters wiped, sink cleared)?',
    min: 1, max: 7, step: 1,
    labels: ['After every use', 'Daily', 'Every 2–3 days', 'Weekly', 'When visibly dirty'],
    default: 2,
  },
  {
    id: 'q9', section: 'clean', dimension: 'clean',
    type: 'scenario_choice',
    text: "There's a week-old pile of dishes in the sink. You didn't create most of them. What do you do?",
    options: [
      { label: "I'd have already washed them day one — can't leave it", value: 1 },
      { label: "Wash them and bring it up to the flatmate directly", value: 2 },
      { label: "Leave a gentle note and hope they get it", value: 3 },
      { label: "Stew silently, avoid the kitchen, eventually explode", value: 4 },
      { label: "It doesn't really bother me much — eventually someone will", value: 5 },
    ],
  },
  {
    id: 'q10', section: 'clean', dimension: 'clean',
    type: 'scenario_choice',
    text: 'How do you feel about shared spaces having personal items left around indefinitely?',
    hint: 'Charger on sofa, toiletries on bathroom counter, shoes in hallway',
    options: [
      { label: "Everything in its place — shared spaces stay impersonal", value: 1 },
      { label: "Some personal items are fine if they're tidy", value: 2 },
      { label: "Mild annoyance but I adapt", value: 3 },
      { label: "Doesn't bother me at all — it makes the space feel lived-in", value: 4 },
    ],
  },
  {
    id: 'q11', section: 'clean', dimension: 'clean',
    type: 'scenario_choice',
    text: 'Your approach to bathroom cleanliness:',
    options: [
      { label: "I clean it every 2–3 days without being asked", value: 1 },
      { label: "Weekly cleaning, I track my turn and do it", value: 2 },
      { label: "I clean when I notice it's dirty, which varies", value: 3 },
      { label: "I prefer someone else takes charge and I contribute occasionally", value: 4 },
      { label: "Honestly it's always a negotiation in every house I've lived in", value: 5 },
    ],
  },
  {
    id: 'q12', section: 'clean', dimension: 'clean',
    type: 'mcq_multi',
    text: 'Which of these would genuinely bother you in a shared flat? (Select all that apply)',
    options: [
      { label: 'Dishes left overnight in the sink', value: 'dishes' },
      { label: 'Cooking smells lingering for hours', value: 'smells' },
      { label: 'Wet clothes on shared bathroom hooks for days', value: 'clothes' },
      { label: "Flatmate's personal items in the fridge for weeks", value: 'fridge' },
      { label: 'Trash not taken out on schedule', value: 'trash' },
      { label: "None of these bother me much", value: 'none' },
    ],
  },
  {
    id: 'q13', section: 'clean', dimension: 'privacy',
    type: 'scenario_choice',
    text: "Your flatmate borrows your charger without asking (you weren't home). What's your reaction?",
    options: [
      { label: "Absolutely fine — that's what flatmates are for", value: 1 },
      { label: "Fine once, but I'd want them to ask going forward", value: 2 },
      { label: "Irritated — personal things need permission always", value: 3 },
      { label: "This would be a genuine trust issue for me", value: 4 },
    ],
  },

  // ─── SECTION 3: FINANCE & EXPENSES ───────────────────────────────────────
  {
    id: 'q14', section: 'finance', dimension: 'finance',
    type: 'scenario_choice',
    text: "Rent is due on the 1st. Your flatmate pays on the 8th (again). You:",
    options: [
      { label: "I've already covered and they've already paid me back — we're fine", value: 1 },
      { label: "I remind once and wait — people forget", value: 2 },
      { label: "I bring it up directly as a pattern that needs to change", value: 3 },
      { label: "This is a red flag — I start looking for a new flatmate", value: 4 },
    ],
  },
  {
    id: 'q15', section: 'finance', dimension: 'finance',
    type: 'scenario_choice',
    text: 'How do you prefer to handle shared household expenses (cooking gas, cleaning supplies, etc.)?',
    options: [
      { label: "Split to the rupee — Splitwise or equivalent, always", value: 1 },
      { label: "Track loosely, settle monthly with some approximation", value: 2 },
      { label: "Each person buys what they use, no pooling", value: 3 },
      { label: "One person buys everything, other reimburses flat amount", value: 4 },
      { label: "Figure it out as we go — I'm flexible", value: 5 },
    ],
  },
  {
    id: 'q16', section: 'finance', dimension: 'finance',
    type: 'scenario_choice',
    text: 'A flatmate suggests upgrading the WiFi plan (₹500/month extra each). You think the current one is fine. What do you do?',
    options: [
      { label: "Happy to upgrade if they want it — it's not much", value: 1 },
      { label: "I'd negotiate — maybe they pay the extra", value: 2 },
      { label: "I'd say no firmly but offer alternatives", value: 3 },
      { label: "I'd feel pressured and probably agree resentfully", value: 4 },
    ],
  },
  {
    id: 'q17', section: 'finance', dimension: 'finance',
    type: 'slider',
    text: "What's your monthly budget for the flat (rent + utilities, your share)?",
    min: 6000, max: 40000, step: 1000,
    labels: ['₹6k', '₹10k', '₹15k', '₹20k', '₹25k', '₹30k', '₹40k+'],
    default: 15000,
    hint: "Be honest about what you can sustain without stress",
  },
  {
    id: 'q18', section: 'finance', dimension: 'finance',
    type: 'scenario_choice',
    text: 'You find out your flatmate earns significantly more than you. How does that affect your split arrangement?',
    options: [
      { label: "Split is always 50/50 regardless of income — fairness means equal share", value: 1 },
      { label: "Open to proportional split if they want a bigger room or more upgrades", value: 2 },
      { label: "They should voluntarily offer to pay more for comfort items", value: 3 },
      { label: "Income difference shouldn't come up in flatmate finances at all", value: 4 },
    ],
  },
  {
    id: 'q19', section: 'finance', dimension: 'finance',
    type: 'scenario_choice',
    text: "Your flatmate buys a ₹3,000 item for the flat (a kettle/lamp) without consulting you, then adds ₹1,500 to your shared expenses sheet. You:",
    options: [
      { label: "Pay without question — good call, useful item", value: 1 },
      { label: "Pay but mention future big purchases need discussion", value: 2 },
      { label: "Decline to pay — wasn't agreed on, not my decision", value: 3 },
      { label: "Passive-aggressively delay payment without explaining why", value: 4 },
    ],
  },

  // ─── SECTION 4: SOCIAL HABITS & GUESTS ───────────────────────────────────
  {
    id: 'q20', section: 'social', dimension: 'social',
    type: 'slider',
    text: 'How often do you typically have friends/guests over at home?',
    min: 1, max: 6, step: 1,
    labels: ['Never', 'Once a month', 'A few times/month', 'Weekly', 'Multiple times/week', 'Daily'],
    default: 2,
  },
  {
    id: 'q21', section: 'social', dimension: 'social',
    type: 'scenario_choice',
    text: 'You come home after a long day and your flatmate has two friends in the living room, watching TV loudly. You:',
    options: [
      { label: "Join them — more the merrier", value: 1 },
      { label: "Say hi politely and retreat to my room, totally fine", value: 2 },
      { label: "Slightly annoyed — I need the living room to decompress", value: 3 },
      { label: "Frustrated — this happens too often and I'm starting to resent home", value: 4 },
    ],
  },
  {
    id: 'q22', section: 'social', dimension: 'social',
    type: 'scenario_choice',
    text: 'How do you feel about notice before guests come over?',
    options: [
      { label: "No notice needed — my home is always open", value: 1 },
      { label: "A quick text same-day is enough", value: 2 },
      { label: "24 hours notice feels right", value: 3 },
      { label: "48+ hours — I need time to mentally prepare and tidy up", value: 4 },
    ],
  },
  {
    id: 'q23', section: 'social', dimension: 'social',
    type: 'scenario_choice',
    text: 'How do you feel about guests staying overnight occasionally?',
    options: [
      { label: "Completely fine — my friends have a place to crash anytime", value: 1 },
      { label: "Fine occasionally with notice", value: 2 },
      { label: "One night here and there is okay, not regularly", value: 3 },
      { label: "I strongly prefer no overnight guests", value: 4 },
    ],
  },
  {
    id: 'q24', section: 'social', dimension: 'personality',
    type: 'slider',
    text: "After a long day, what does \"recharging\" look like for you?",
    min: 1, max: 5, step: 1,
    labels: ['Need complete silence & solitude', 'Prefer quiet but company is fine', 'Either works', 'Prefer light social interaction', 'Need people around to feel energised'],
    default: 2,
  },
  {
    id: 'q25', section: 'social', dimension: 'social',
    type: 'scenario_choice',
    text: 'Regarding guests of the opposite gender staying overnight at the flat:',
    hint: 'This is a hard filter — be honest about what you can actually live with.',
    options: [
      { label: "Fully comfortable — no restrictions", value: 1 },
      { label: "Fine with it but I'd want to know in advance", value: 2 },
      { label: "Uncomfortable but I'd tolerate it if flatmate is very discreet", value: 3 },
      { label: "Not acceptable in a shared flat I live in", value: 4 },
    ],
  },
  {
    id: 'q26', section: 'social', dimension: 'social',
    type: 'scenario_choice',
    text: 'Your parents are visiting and want to stay for 2 weeks. How would you handle it with your flatmate?',
    options: [
      { label: "Ask permission well in advance, negotiate, flexible if needed", value: 1 },
      { label: "Inform them — it's my right but I'd be considerate", value: 2 },
      { label: "I wouldn't have parents stay — I'd put them in a nearby hotel", value: 3 },
      { label: "Family visits for that long aren't something I do", value: 4 },
    ],
  },

  // ─── SECTION 5: CONFLICT & COMMUNICATION ─────────────────────────────────
  {
    id: 'q27', section: 'conflict', dimension: 'conflict',
    type: 'scenario_choice',
    text: "Your flatmate does something that bothers you (not a huge thing, but recurring). What's your natural first move?",
    options: [
      { label: "Bring it up directly the same day — calmly but clearly", value: 1 },
      { label: "Wait for a calm moment and bring it up within a week", value: 2 },
      { label: "Drop a hint or send a passive message hoping they pick up on it", value: 3 },
      { label: "Say nothing and handle it internally until I can't anymore", value: 4 },
    ],
  },
  {
    id: 'q28', section: 'conflict', dimension: 'conflict',
    type: 'scenario_choice',
    text: "Your flatmate confronts you directly about something you did. What's your default reaction?",
    options: [
      { label: "Engage immediately — I appreciate directness", value: 1 },
      { label: "Listen and respond but need a moment to process", value: 2 },
      { label: "Feel attacked even if the tone is calm — I shut down", value: 3 },
      { label: "Get defensive and dismiss it initially", value: 4 },
    ],
  },
  {
    id: 'q29', section: 'conflict', dimension: 'conflict',
    type: 'scenario_choice',
    text: "You've raised the same issue with your flatmate three times. It hasn't changed. You:",
    options: [
      { label: "Have a frank sit-down and say this is a dealbreaker", value: 1 },
      { label: "Try a different approach — maybe I'm not communicating right", value: 2 },
      { label: "Give up on that issue and absorb it", value: 3 },
      { label: "Start planning to leave — three strikes", value: 4 },
      { label: "I wouldn't have raised it three times — I'd have moved on by then", value: 5 },
    ],
  },
  {
    id: 'q30', section: 'conflict', dimension: 'conflict',
    type: 'scenario_choice',
    text: 'How do you prefer disagreements to end?',
    options: [
      { label: "Resolved with clear agreement and behavioral change", value: 1 },
      { label: "Talked through even if no solution, just mutual understanding", value: 2 },
      { label: "Return to normal without needing explicit resolution", value: 3 },
      { label: "A sincere apology, then move on", value: 4 },
    ],
  },
  {
    id: 'q31', section: 'conflict', dimension: 'privacy',
    type: 'scenario_choice',
    text: 'Your flatmate appears in the background of your video call (work meeting) without warning. You:',
    options: [
      { label: "Fine — they live here too, no big deal", value: 1 },
      { label: "Mildly uncomfortable — I'd mention it later", value: 2 },
      { label: "Frustrated — I expect people to stay away from shared areas during my calls", value: 3 },
      { label: "I always take calls in my room and expect the same", value: 4 },
    ],
  },

  // ─── SECTION 6: CULTURE, VALUES & IDENTITY ───────────────────────────────
  {
    id: 'q32', section: 'culture', dimension: 'culture',
    type: 'scenario_choice',
    text: 'Your flatmate plays devotional music or prayer audio in common areas every morning. You:',
    options: [
      { label: "Totally fine — it's peaceful", value: 1 },
      { label: "Okay if it's at a reasonable volume and reasonable hour", value: 2 },
      { label: "Mildly uncomfortable but I'd adapt", value: 3 },
      { label: "I'd need them to keep religious practices to their room", value: 4 },
    ],
  },
  {
    id: 'q33', section: 'culture', dimension: 'culture',
    type: 'scenario_choice',
    text: 'About food and the shared kitchen:',
    hint: 'Select the description that best fits your actual food identity',
    options: [
      { label: 'Strict Jain / religious vegetarian — kitchen purity really matters to me', value: 1 },
      { label: 'Strict vegetarian — no meat smell or shared utensils with non-veg', value: 2 },
      { label: 'Vegetarian but okay with eggs', value: 3 },
      { label: 'Non-vegetarian but no beef', value: 4 },
      { label: 'Fully non-vegetarian — no restrictions', value: 5 },
    ],
  },
  {
    id: 'q34', section: 'culture', dimension: 'culture',
    type: 'scenario_choice',
    text: 'How often do family members visit you and typically stay at the flat?',
    options: [
      { label: "Never — family lives nearby or I visit them", value: 1 },
      { label: "Rarely — once a year or less, briefly", value: 2 },
      { label: "Occasionally — 2–3 times a year, for a few days", value: 3 },
      { label: "Regularly — quarterly visits, sometimes 1–2 weeks", value: 4 },
      { label: "Frequently — monthly or more, family is very present in my life", value: 5 },
    ],
  },
  {
    id: 'q35', section: 'culture', dimension: 'lifestyle',
    type: 'scenario_choice',
    text: 'What best describes your current life stage?',
    hint: 'This is a hard filter — dramatically different stages create structural incompatibilities.',
    options: [
      { label: 'Student (undergrad or postgrad)', value: 'student' },
      { label: 'Early career professional (0–3 years)', value: 'earlycareer' },
      { label: 'Mid-career professional (3+ years)', value: 'midcareer' },
      { label: 'Freelancer / entrepreneur / remote worker', value: 'freelance' },
      { label: 'Part-time worker or between jobs', value: 'parttime' },
    ],
  },
  {
    id: 'q36', section: 'culture', dimension: 'social',
    type: 'scenario_choice',
    text: 'You drink socially sometimes. How do you feel about alcohol in the flat?',
    options: [
      { label: "I drink — completely fine with it in the flat", value: 1 },
      { label: "I don't drink but I'm fine if others do responsibly", value: 2 },
      { label: "I'd prefer no drinking in common areas", value: 3 },
      { label: "I'm not comfortable with alcohol in the flat at all", value: 4 },
    ],
  },
];

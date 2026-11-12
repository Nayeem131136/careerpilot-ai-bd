export const CATEGORIES = [
  { name: "Technology", roles: ["Software Engineer", "IT Support", "AI / ML Engineer", "Cyber Security", "Data Analyst", "DevOps / Cloud", "QA Engineer"] },
  { name: "Business", roles: ["Business Analyst", "Operations Executive", "Management Trainee"] },
  { name: "Marketing", roles: ["Digital Marketing", "SEO", "Social Media", "Brand Executive", "Content"] },
  { name: "Finance", roles: ["Accountant", "Finance Analyst", "Banking", "Audit"] },
  { name: "Administration", roles: ["HR", "Admin", "Office Executive"] },
  { name: "Design", roles: ["Graphic Designer", "UI/UX Designer", "Creative Designer"] },
  { name: "Education & Research", roles: ["Teacher", "Lecturer", "Research Assistant", "Academic Assistant"] },
  { name: "Engineering", roles: ["Civil", "Electrical", "Mechanical", "Industrial"] },
  { name: "Healthcare", roles: ["Healthcare Administration", "Medical Research", "Health Operations"] },
  { name: "Sales", roles: ["Sales Executive", "Business Development", "Account Manager"] },
  { name: "Customer Service", roles: ["Customer Support", "Customer Success", "Client Relations"] },
  { name: "And more", roles: ["Anything your CV points to, even if it is not on this list"] },
];

export const FEATURES = [
  { title: "CV Intelligence", body: "Upload a PDF or DOCX in English or Bengali. AI extracts education, skills, projects and experience, then you review and correct everything before it is used." },
  { title: "All jobs in Bangladesh, remote jobs worldwide", body: "Every job inside Bangladesh, plus remote roles from the rest of the world. Jobs come from permitted sources only and each one shows where it came from." },
  { title: "Explainable job matching", body: "Every job gets a score with reasons: skills you have, skills you miss and a clear recommendation. It is guidance, not a hiring prediction." },
  { title: "Scholarships with official links", body: "Browse scholarships by country, level and field, with what they cover, who can apply, how to apply and the deadline. Every entry links to the official page and is checked by an admin." },
  { title: "Deadlines and calendar reminders", body: "Application deadlines and saved scholarships in one list, with an .ics file for your phone or Google Calendar so you get a reminder a week and a day before." },
  { title: "Application drafts, never auto-sent", body: "AI drafts the email subject, body and cover letter in English or Bengali. You review, edit and send it yourself. We never email anyone on your behalf." },
  { title: "Application tracker", body: "Track every opportunity from Interested to Offer, with notes, your own deadline and a history you control." },
  { title: "Skill gaps and learning roadmap", body: "See which skills are missing for the jobs you want and get a step-by-step plan to close the gap, with progress tracking." },
  { title: "Bengali and English circulars", body: "Paste or link a Bengali or English job circular and let AI pull out the title, deadline, requirements and how to apply." },
];

export const EXCLUSIVE = [
  { title: "Closed jobs hidden automatically", body: "Jobs whose deadline has passed are hidden from your feed, jobs closing soon are tagged, and you can still show closed jobs when you want to." },
  { title: "Scholarship link checker", body: "Official scholarship pages are re-checked every week. If a page changes or breaks, it is flagged for review instead of silently going out of date." },
  { title: "Admin-controlled AI", body: "The platform admin chooses the AI provider and key. Your CV text only goes to that provider, and keys are stored encrypted." },
  { title: "Your data, your control", body: "Export your data or delete your account at any time. Errors are logged without personal details." },
];

export const STEPS = [
  { n: "01", title: "Upload your CV", body: "PDF or DOCX, English or Bengali. Your file stays private to your account." },
  { n: "02", title: "Review what AI understood", body: "Check extracted skills, education and experience. Fix anything before it is used." },
  { n: "03", title: "Find jobs and scholarships", body: "Browse jobs in Bangladesh and remote jobs worldwide, and scholarships with official links. Save what interests you." },
  { n: "04", title: "Match and understand", body: "See why each job fits, what is missing and which skills to learn next." },
  { n: "05", title: "Prepare, apply yourself and track", body: "Get tailored drafts. Review, edit and send them yourself, then track the result and your deadlines." },
];

export const FAQ = [
  { q: "Does CareerPilot AI apply to jobs for me?", a: "No. It prepares drafts and checklists only. You send every application yourself, so nothing goes out without you." },
  { q: "Where do the jobs come from?", a: "From permitted sources only: official APIs, open feeds, public company career boards, and job circulars or links that you submit. We never bypass logins, CAPTCHAs or site terms, and each job shows its source." },
  { q: "Will I see every job in the world?", a: "No honest service can promise that. You see every job we can find in Bangladesh from the connected sources, plus remote jobs from elsewhere. The app shows which sources were searched." },
  { q: "Are the scholarships verified?", a: "Each scholarship links to its official page and is reviewed by an admin before it is shown. Pages are re-checked weekly, but always confirm the details and deadline on the official site before you apply." },
  { q: "Can I use it if I am not from IT?", a: "Yes. CareerPilot AI is built for every field: business, marketing, finance, design, education, engineering, healthcare and more." },
  { q: "Is my CV safe?", a: "Your CV is stored privately and is only visible to your account. CV text is processed by the AI provider that the platform is configured with. You can delete your CV or your whole account at any time and export your data." },
  { q: "Is the match score a chance of getting hired?", a: "No. It is an explained comparison between your CV and the job. Treat it as guidance." },
  { q: "Is it free?", a: "It is free during the beta, within fair-use limits that depend on the AI and infrastructure quotas available." },
];

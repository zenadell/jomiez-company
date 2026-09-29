/* Privacy policy and terms, taken from jomiez.com. */
export type LegalSection = { title: string; intro?: string; items?: string[]; body?: string };

export const privacy: LegalSection[] = [
  {
    title: "Personal information we collect",
    items: [
      "Name",
      "Email address",
      "Phone number",
      "Company name",
      "Billing information",
      "Any other information you provide via contact forms or project inquiries",
    ],
  },
  {
    title: "Non-personal information we collect",
    items: ["Browser type", "IP address", "Device information", "Website usage data (via cookies and analytics tools)"],
  },
  {
    title: "How we use your information",
    intro: "We use the information we collect to:",
    items: [
      "Respond to inquiries or project requests",
      "Deliver design services and manage client accounts",
      "Send invoices and process payments",
      "Improve website functionality and user experience",
      "Communicate updates, newsletters, or promotions (with consent)",
      "Comply with legal obligations",
    ],
  },
  {
    title: "Sharing your information",
    intro: "We do not sell your personal information. We may share your data with:",
    items: [
      "Trusted third-party service providers (e.g., payment processors, email platforms)",
      "Law enforcement or regulatory bodies when required by law",
      "Our professional advisors (e.g., accountants, legal counsel)",
    ],
  },
  {
    title: "Cookies and tracking technologies",
    intro: "We use cookies and similar technologies to:",
    items: [
      "Understand how you use our website",
      "Improve functionality and performance",
      "Provide personalized content and ads (if applicable)",
    ],
  },
  {
    title: "Data retention",
    body: "We retain your information only as long as necessary for the purposes outlined in this policy or as required by law.",
  },
  {
    title: "Your rights",
    intro: "Depending on your location, you may have the right to:",
    items: [
      "Access the personal data we hold about you",
      "Request correction or deletion",
      "Object to or restrict processing",
      "Withdraw consent (where applicable)",
    ],
  },
];

export const terms: LegalSection[] = [
  {
    title: "Acceptance of terms",
    body: "By accessing and using the Jomiez Innovation website and services, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our services.",
  },
  {
    title: "Services provided",
    intro: "Jomiez Innovation provides the following services:",
    items: [
      "Custom software development (web, mobile, and desktop applications)",
      "AI integration and machine learning solutions",
      "UI/UX design and brand identity",
      "Digital transformation and consulting",
      "Website maintenance and support",
    ],
  },
  {
    title: "Intellectual property",
    body: "All content on this website — including but not limited to text, graphics, logos, images, code, and design — is the intellectual property of Jomiez Innovation unless otherwise stated. You may not reproduce, distribute, or create derivative works from any content without prior written consent.",
  },
  {
    title: "Project agreements",
    intro: "When engaging Jomiez Innovation for a project:",
    items: [
      "A separate project agreement or contract will be provided outlining scope, deliverables, timeline, and payment terms",
      "All project-specific terms in the agreement take precedence over these general terms",
      "Changes to project scope may require additional costs and revised timelines",
    ],
  },
  {
    title: "Payment terms",
    items: [
      "Payment schedules will be outlined in individual project contracts",
      "Late payments may incur additional fees as specified in the project agreement",
      "Refunds are handled on a case-by-case basis and subject to the terms of the project agreement",
    ],
  },
  {
    title: "Limitation of liability",
    body: "Jomiez Innovation shall not be held liable for any indirect, incidental, or consequential damages arising from the use of our services or website. Our total liability shall not exceed the amount paid by the client for the specific service in question.",
  },
  {
    title: "Confidentiality",
    body: "Both parties agree to maintain confidentiality of any proprietary information shared during the course of a project. This obligation survives the termination of any agreement between the parties.",
  },
  {
    title: "Termination",
    body: "Either party may terminate an engagement with written notice as outlined in the project agreement. Upon termination, all outstanding payments for work completed shall become due immediately.",
  },
];

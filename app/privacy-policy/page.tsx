import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/LegalPage";
import { privacy } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Jomiez Innovation collects, uses and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what information Jomiez Innovation collects when you use our website and services, and how we use and protect it."
      sections={privacy}
    />
  );
}

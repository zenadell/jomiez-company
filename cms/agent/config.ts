import type { Access, CollectionConfig, Field, GlobalConfig } from "payload";
import { adminsOnly, hasRole, signedIn } from "../access";
import { DEFAULT_FAST_MODEL, DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDERS } from "./providers";
import { nextRunAt } from "./schedule";
import { encrypt, hint, isEncrypted } from "./secrets";

/*
 * The agent's settings and its own records: conversations (everything it has
 * done, step by step), memory (what it knows about the company and how you
 * like things), and routines (work it does on a schedule).
 */

export const AGENT_GROUP = "Agent";

/** The value the key field sends to remove a saved key. */
export const CLEAR_KEY = "__clear__";

const SECRET_FIELDS = ["apiKey", "voiceApiKey"] as const;
const MODEL_PICKER = { path: "/cms/admin/agent/ModelPicker#ModelPicker", clientProps: { purpose: "text" } };
const VOICE_MODEL_PICKER = { path: "/cms/admin/agent/ModelPicker#ModelPicker", clientProps: { purpose: "voice" } };

/** The model the old site's Chaka used for live voice. */
export const DEFAULT_VOICE_MODEL = "gemini-3.1-flash-live-preview";

/*
 * A key field: stored encrypted, stripped from every read (the agent's own
 * server-side read asks for it with the revealAgentKey context flag), with a
 * hidden "last four characters" hint for the settings screen.
 */
function secret(name: string, label: string, description: string): Field[] {
  return [
    {
      name,
      label,
      type: "text",
      hooks: { afterRead: [({ value, context }) => (context?.revealAgentKey ? value : null)] },
      admin: { components: { Field: "/cms/admin/agent/SecretField#SecretField" }, description },
    },
    { name: `${name}Hint`, type: "text", admin: { hidden: true, readOnly: true } },
  ];
}

const PERSONA = `Write like jomiez.com: an ancient, natural voice (roots, seasons, gardens, craft), calm and certain, never hype. Short sentences. Plain words. No exclamation marks.
Jomiez Innovation is a software company that grows its own AI products (Chaka AI, Chaka WAP) and builds custom software for businesses.
Never invent facts, numbers, clients or testimonials. If something isn't known, ask or leave it out.`;

export const AgentSettings: GlobalConfig = {
  slug: "agent",
  label: "Agent settings",
  admin: {
    group: AGENT_GROUP,
    description: "The model that powers the agent, what it may do on its own, its voice and its limits.",
  },
  access: { read: adminsOnly, update: adminsOnly },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "enabled",
          label: "The agent is on",
          type: "checkbox",
          defaultValue: true,
          admin: {
            width: "50%",
            description: "Off stops every conversation, routine and automatic action at once.",
          },
        },
        { name: "name", label: "Its name", type: "text", defaultValue: "Keeper", required: true, admin: { width: "50%" } },
      ],
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Model",
          description: "The agent works with any model. The model gives it language; the agent gives it the site, the tools, the memory and the rules.",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "provider",
                  label: "Provider",
                  type: "select",
                  required: true,
                  defaultValue: DEFAULT_PROVIDER,
                  options: Object.entries(PROVIDERS).map(([value, p]) => ({ value, label: p.label })),
                  admin: { width: "50%" },
                },
                {
                  name: "model",
                  label: "Model",
                  type: "text",
                  required: true,
                  defaultValue: DEFAULT_MODEL,
                  admin: {
                    width: "50%",
                    description: "The model's ID, exactly as the provider writes it (e.g. deepseek-v4-flash). Choose from your account to see every model your key can use, new ones included.",
                    components: { afterInput: [MODEL_PICKER] },
                  },
                },
              ],
            },
            ...secret("apiKey", "API key", "Stored encrypted and never shown again, not even to the agent."),
            {
              name: "baseURL",
              label: "Service address (base URL)",
              type: "text",
              admin: {
                condition: (data) => !["anthropic", "openai", "google"].includes(data?.provider),
                description: "Only needed for your own server or a service not in the list, e.g. http://localhost:11434/v1 for Ollama.",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "fastModel",
                  label: "Quick model (optional)",
                  type: "text",
                  defaultValue: DEFAULT_FAST_MODEL,
                  admin: {
                    width: "50%",
                    components: { afterInput: [MODEL_PICKER] },
                    description: "A cheaper model, same provider, for background work: sorting messages and helper tasks. Empty: the main model does everything.",
                  },
                },
                {
                  name: "thinking",
                  label: "Thinking effort",
                  type: "select",
                  defaultValue: "provider-default",
                  options: [
                    { value: "provider-default", label: "Model's default" },
                    { value: "none", label: "Off (fastest)" },
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                    { value: "xhigh", label: "Maximum" },
                  ],
                  admin: { width: "50%", description: "How hard it thinks before acting, on models that support it." },
                },
              ],
            },
          ],
        },
        {
          label: "Voice",
          description:
            "Talk with the agent out loud, in real time, and it acts while you speak (Gemini Live). Your key stays on the server: the browser only ever gets a single-use pass that expires within minutes.",
          fields: [
            { name: "voiceEnabled", label: "Voice conversations are on", type: "checkbox", defaultValue: true },
            {
              type: "row",
              fields: [
                {
                  name: "voiceModel",
                  label: "Live model",
                  type: "text",
                  defaultValue: DEFAULT_VOICE_MODEL,
                  admin: {
                    width: "50%",
                    description: "A Gemini model that supports live audio. Choose from your account to see the ones your key can use.",
                    components: { afterInput: [VOICE_MODEL_PICKER] },
                  },
                },
                {
                  name: "voiceName",
                  label: "Its voice",
                  type: "text",
                  defaultValue: "Kore",
                  admin: {
                    width: "25%",
                    description: "Choose one to hear the difference in your next conversation.",
                    components: { afterInput: ["/cms/admin/agent/VoicePicker#VoicePicker"] },
                  },
                },
                {
                  name: "voiceLanguage",
                  label: "Language (optional)",
                  type: "text",
                  admin: { width: "25%", description: "e.g. en-US, en-GB. Empty: it follows you." },
                },
              ],
            },
            ...secret(
              "voiceApiKey",
              "Gemini key for voice (optional)",
              "Empty: the main key when the main provider is Google, else GEMINI_API_KEY from the environment.",
            ),
          ],
        },
        {
          label: "Sight & images",
          description:
            "It can take screenshots of any page and look at them, look at images, find the pictures on any website, and make original images. Seeing and making images use the Gemini key from the Voice tab (or GEMINI_API_KEY); without one it sees through the main model if that model can (Claude, GPT or Gemini).",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "visionModel",
                  label: "Model for seeing (optional)",
                  type: "text",
                  admin: {
                    width: "50%",
                    description: "Empty: the newest everyday Gemini model on the key.",
                    components: { afterInput: [{ path: "/cms/admin/agent/ModelPicker#ModelPicker", clientProps: { purpose: "vision" } }] },
                  },
                },
                {
                  name: "imageModel",
                  label: "Model for making images (optional)",
                  type: "text",
                  admin: {
                    width: "50%",
                    description: "Empty: the newest Gemini image model on the key.",
                    components: { afterInput: [{ path: "/cms/admin/agent/ModelPicker#ModelPicker", clientProps: { purpose: "image" } }] },
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Permissions",
          description: "What it may do without asking. Whatever it asks about waits for your approval, with the exact change shown. Everything it does is recorded and can be undone.",
          fields: [
            {
              name: "mode",
              label: "Autonomy",
              type: "radio",
              defaultValue: "drafts",
              options: [
                { value: "ask", label: "Ask me before any change" },
                { value: "drafts", label: "Draft freely, ask before anything goes live" },
                { value: "trusted", label: "Publish on its own, ask before deleting or emailing" },
                { value: "full", label: "Full autonomy" },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "deletes",
                  label: "Deleting",
                  type: "select",
                  defaultValue: "ask",
                  options: [
                    { value: "never", label: "Never" },
                    { value: "ask", label: "Ask me first" },
                    { value: "auto", label: "Allowed (with full autonomy)" },
                  ],
                  admin: { width: "33%" },
                },
                {
                  name: "email",
                  label: "Sending email",
                  type: "select",
                  defaultValue: "ask",
                  options: [
                    { value: "never", label: "Never" },
                    { value: "ask", label: "Ask me first" },
                    { value: "auto", label: "Allowed (with full autonomy)" },
                  ],
                  admin: { width: "33%" },
                },
                {
                  name: "web",
                  label: "May read other websites",
                  type: "checkbox",
                  defaultValue: true,
                  admin: { width: "34%" },
                },
              ],
            },
            {
              name: "note",
              type: "ui",
              admin: { components: { Field: "/cms/admin/agent/PermissionsNote#PermissionsNote" } },
            },
          ],
        },
        {
          label: "Style & standing orders",
          fields: [
            {
              name: "persona",
              label: "How it should write and behave",
              type: "textarea",
              defaultValue: PERSONA,
              admin: { rows: 10, description: "Read before every task. Its memory (Agent → Memory) adds what it learns over time." },
            },
          ],
        },
        {
          label: "Automation",
          fields: [
            {
              name: "triage",
              label: "Read every new contact message as it arrives",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "It sorts the message (lead, question, spam), writes a summary in the notes and marks obvious spam. It never replies on its own.",
              },
            },
            {
              name: "triageDraft",
              label: "Also draft a reply for each real message",
              type: "checkbox",
              defaultValue: true,
            },
            {
              name: "notifyAuto",
              label: "Email me every time it acts on its own",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description:
                  "After each routine and each new message it reads: what it did, what it changed and anything waiting for your approval. Every one also appears under the bell in the Agent console.",
              },
            },
            {
              name: "notifyEmail",
              label: "Send those emails to",
              type: "email",
              admin: {
                condition: (data) => data?.notifyAuto !== false,
                description: "Empty: ADMIN_NOTIFY_EMAIL, else the address in Site settings. Needs email set up (RESEND_API_KEY).",
              },
            },
          ],
        },
        {
          label: "Limits",
          fields: [
            {
              type: "row",
              fields: [
                { name: "maxSteps", label: "Most steps per task", type: "number", defaultValue: 40, min: 5, max: 200, admin: { width: "33%" } },
                { name: "dailyRuns", label: "Most tasks per day", type: "number", defaultValue: 300, min: 1, admin: { width: "33%" } },
                {
                  name: "dailyTokens",
                  label: "Most tokens per day",
                  type: "number",
                  defaultValue: 5_000_000,
                  min: 10_000,
                  admin: { width: "34%", description: "Keeps the model bill predictable." },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const next = { ...data } as Record<string, unknown>;
        let stored: Record<string, unknown> | null | undefined;
        for (const name of SECRET_FIELDS) {
          const incoming = next[name] as string | null | undefined;
          if (incoming === CLEAR_KEY) {
            next[name] = null;
            next[`${name}Hint`] = null;
          } else if (typeof incoming === "string" && incoming.trim() && !isEncrypted(incoming)) {
            next[name] = encrypt(incoming.trim());
            next[`${name}Hint`] = hint(incoming.trim());
          } else {
            // Untouched (the browser never has the saved key): keep what's stored. Read
            // it from the database itself, since every normal read leaves keys out.
            stored ??= (await req.payload.db.findGlobal({ slug: "agent", req })) as Record<string, unknown> | null;
            next[name] = stored?.[name] ?? null;
            next[`${name}Hint`] = stored?.[`${name}Hint`] ?? null;
          }
        }
        return next;
      },
    ],
  },
};

const adminsOrOwner: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (hasRole(user, "admin")) return true;
  return { owner: { equals: user.id } };
};

export const AgentThreads: CollectionConfig = {
  slug: "agent-threads",
  labels: { singular: "Conversation", plural: "Conversations" },
  admin: {
    group: AGENT_GROUP,
    useAsTitle: "title",
    defaultColumns: ["title", "status", "source", "owner", "updatedAt"],
    description: "Every task the agent has worked on: what it was asked, each step it took, and every change it made.",
    components: { beforeList: ["/cms/admin/agent/OpenConsole#OpenConsole"] },
  },
  access: { read: adminsOrOwner, create: () => false, update: () => false, delete: adminsOrOwner },
  timestamps: true,
  fields: [
    { name: "title", type: "text", required: true },
    { name: "owner", label: "Asked by", type: "relationship", relationTo: "users" },
    {
      name: "source",
      type: "select",
      defaultValue: "console",
      options: [
        { value: "console", label: "Agent console" },
        { value: "page", label: "While editing" },
        { value: "voice", label: "Voice" },
        { value: "routine", label: "Routine" },
        { value: "inbox", label: "New message" },
      ],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "idle",
      options: [
        { value: "idle", label: "Done" },
        { value: "running", label: "Working" },
        { value: "waiting", label: "Waiting for approval" },
        { value: "stopped", label: "Stopped" },
        { value: "error", label: "Error" },
      ],
    },
    { name: "context", type: "json" },
    { name: "messages", type: "json" },
    { name: "events", type: "json" },
    { name: "plan", type: "json" },
    { name: "pending", type: "json" },
    { name: "changes", type: "json" },
    { name: "model", type: "text" },
    {
      name: "usage",
      type: "group",
      fields: [
        { name: "input", type: "number", defaultValue: 0 },
        { name: "output", type: "number", defaultValue: 0 },
      ],
    },
    { name: "routine", type: "relationship", relationTo: "agent-routines" },
  ],
};

export const AgentMemory: CollectionConfig = {
  slug: "agent-memory",
  labels: { singular: "Memory", plural: "Memory" },
  admin: {
    group: AGENT_GROUP,
    useAsTitle: "content",
    defaultColumns: ["content", "kind", "source", "updatedAt"],
    description:
      "What the agent knows and keeps in mind in every task: facts about the company, your preferences, and lessons from changes you turned down. Edit or delete anything.",
  },
  access: { read: signedIn, create: signedIn, update: signedIn, delete: signedIn },
  fields: [
    { name: "content", label: "What to remember", type: "textarea", required: true },
    {
      type: "row",
      fields: [
        {
          name: "kind",
          type: "select",
          defaultValue: "fact",
          options: [
            { value: "fact", label: "Fact" },
            { value: "preference", label: "Preference" },
            { value: "voice", label: "Voice & style" },
            { value: "lesson", label: "Lesson" },
            { value: "contact", label: "Person or company" },
          ],
          admin: { width: "50%" },
        },
        {
          name: "source",
          type: "select",
          defaultValue: "you",
          options: [
            { value: "you", label: "You" },
            { value: "agent", label: "The agent" },
            { value: "correction", label: "A change you turned down" },
          ],
          admin: { width: "50%" },
        },
      ],
    },
  ],
};

export const AgentRoutines: CollectionConfig = {
  slug: "agent-routines",
  labels: { singular: "Routine", plural: "Routines" },
  admin: {
    group: AGENT_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "enabled", "schedule", "nextRunAt", "lastStatus"],
    description: "Work the agent does on its own, on a schedule, with the permissions of the person who set it up.",
  },
  access: { read: signedIn, create: signedIn, update: signedIn, delete: signedIn },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "instruction",
      label: "What to do",
      type: "textarea",
      required: true,
      admin: { rows: 6, description: "Write it as you would to a colleague. It can read, change and report on anything it's allowed to." },
    },
    { name: "enabled", label: "On", type: "checkbox", defaultValue: true },
    {
      type: "row",
      fields: [
        {
          name: "schedule",
          type: "select",
          required: true,
          defaultValue: "daily",
          options: [
            { value: "hourly", label: "Every hour" },
            { value: "daily", label: "Every day" },
            { value: "weekdays", label: "Every weekday" },
            { value: "weekly", label: "Every week" },
            { value: "monthly", label: "Every month (on the 1st)" },
          ],
          admin: { width: "34%" },
        },
        {
          name: "time",
          label: "At",
          type: "text",
          defaultValue: "08:00",
          admin: { width: "22%", condition: (_, s) => s?.schedule !== "hourly", description: "24-hour time" },
          validate: (v: unknown) => (!v || /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v)) ? true : "Use HH:MM, e.g. 08:30"),
        },
        {
          name: "weekday",
          label: "On",
          type: "select",
          defaultValue: "1",
          options: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((label, i) => ({
            label,
            value: String(i),
          })),
          admin: { width: "22%", condition: (_, s) => s?.schedule === "weekly" },
        },
        {
          name: "timezone",
          label: "Time zone",
          type: "text",
          defaultValue: "Africa/Lagos",
          admin: { width: "22%" },
        },
      ],
    },
    {
      name: "mode",
      label: "Autonomy for this routine",
      type: "select",
      defaultValue: "inherit",
      options: [
        { value: "inherit", label: "Same as Agent settings" },
        { value: "ask", label: "Ask before any change" },
        { value: "drafts", label: "Draft freely, ask before anything goes live" },
        { value: "trusted", label: "Publish on its own" },
        { value: "full", label: "Full autonomy" },
      ],
    },
    { name: "owner", label: "Runs as", type: "relationship", relationTo: "users", admin: { position: "sidebar" } },
    { name: "nextRunAt", label: "Next run", type: "date", admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
    { name: "lastRunAt", label: "Last run", type: "date", admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
    { name: "lastStatus", label: "Last result", type: "text", admin: { position: "sidebar", readOnly: true } },
    { name: "lastThread", label: "Last conversation", type: "relationship", relationTo: "agent-threads", admin: { position: "sidebar", readOnly: true } },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, originalDoc, context }) => {
        const next = { ...data };
        if (!next.owner && !originalDoc?.owner && req.user) next.owner = req.user.id;
        // A run records its own next time; any other edit re-plans from now.
        if (!context.keepSchedule) {
          const merged = { ...originalDoc, ...next };
          next.nextRunAt = merged.enabled === false ? null : nextRunAt(merged, new Date()).toISOString();
        }
        return next;
      },
    ],
  },
};

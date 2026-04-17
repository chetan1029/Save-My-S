import { redact, scan } from "../src/detectors";

interface Case {
  name: string;
  text: string;
  expect: string[];
  shouldNot?: string[];
}

const cases: Case[] = [
  {
    name: "Email (simple + plus address + subdomain)",
    text: "ping me at jane.doe@example.com or test+ci@mail.corp.example.io",
    expect: ["EMAIL", "EMAIL"],
  },
  {
    name: "Credit card valid (Visa, MC, AmEx)",
    text: "v: 4111 1111 1111 1111 mc: 5555-5555-5555-4444 amex: 378282246310005",
    expect: ["CREDIT_CARD", "CREDIT_CARD", "CREDIT_CARD"],
  },
  {
    name: "Credit card invalid Luhn — should NOT match",
    text: "fake: 4111 1111 1111 1112",
    expect: [],
  },
  {
    name: "OpenAI key (sk- and sk-proj-)",
    text: "key: sk-abcdef1234567890abcdefXYZ and sk-proj-aaaabbbbccccddddeeee",
    expect: ["OPENAI_KEY", "OPENAI_KEY"],
  },
  {
    name: "Anthropic key",
    text: "ANTHROPIC=sk-ant-api03-AAAABBBBCCCCDDDDEEEEFFFF",
    expect: ["ANTHROPIC_KEY"],
  },
  {
    name: "AWS access key",
    text: "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE and ASIATESTKEY123456789",
    expect: ["AWS_KEY", "AWS_KEY"],
  },
  {
    name: "GitHub token",
    text: "GH_TOKEN=ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa fine-grain ghu_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    expect: ["GITHUB_TOKEN", "GITHUB_TOKEN"],
  },
  {
    name: "Google API key",
    text: "GOOGLE_KEY=AIzaSyAabcdefghijklmnopqrstuvwxyz012345",
    expect: ["GOOGLE_API_KEY"],
  },
  {
    name: "Stripe live + test",
    text: "sk_live_abcdefghijklmnop pk_test_qrstuvwxyz123456",
    expect: ["STRIPE_KEY", "STRIPE_KEY"],
  },
  {
    name: "Slack token",
    text: "SLACK=xoxb-1234567890-abcdef-XYZ",
    expect: ["SLACK_TOKEN"],
  },
  {
    name: "JWT",
    text: "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.abcdefgh",
    expect: ["JWT"],
  },
  {
    name: "Private key block",
    text: "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJB\n-----END RSA PRIVATE KEY-----",
    expect: ["PRIVATE_KEY"],
  },
  {
    name: "Phone numbers (US, intl)",
    text: "call me at (415) 555-0123 or +44 20 7946 0958",
    expect: ["PHONE", "PHONE"],
  },
  {
    name: "Phone — should NOT match a year alone",
    text: "this happened in 2024",
    expect: [],
  },
  {
    name: "SSN valid; invalid-SSN patterns fall through to PHONE (still redacted)",
    text: "ssn 123-45-6789 not 000-12-3456 not 666-12-3456 not 900-12-3456",
    expect: ["SSN", "PHONE", "PHONE", "PHONE"],
  },
  {
    name: "IPv4 valid + invalid",
    text: "host 192.168.1.42 bad 999.1.1.1 zero 0.0.0.0",
    expect: ["IPV4"],
  },
  {
    name: "Mixed kitchen sink",
    text: `Hi team,
Reach me at alice@corp.example.com (cell (212) 555-7788).
Card on file: 4111 1111 1111 1111 — SSN 123-45-6789.
Production keys: sk-proj-abcdefghijklmnop1234, AKIAIOSFODNN7EXAMPLE.
JWT: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.abcdefgh
Server: 10.0.0.42`,
    expect: [
      "EMAIL",
      "PHONE",
      "CREDIT_CARD",
      "SSN",
      "OPENAI_KEY",
      "AWS_KEY",
      "JWT",
      "IPV4",
    ],
  },
  {
    name: "No secrets",
    text: "Just a friendly hello, asking about the weather.",
    expect: [],
  },
];

let passed = 0;
let failed = 0;

for (const c of cases) {
  const matches = scan(c.text);
  const labels = matches.map((m) => m.label).sort();
  const expected = [...c.expect].sort();
  const ok =
    labels.length === expected.length &&
    labels.every((l, i) => l === expected[i]);

  const symbol = ok ? "✔" : "✘";
  console.log(`${symbol}  ${c.name}`);
  if (!ok) {
    failed++;
    console.log(`     expected: [${expected.join(", ")}]`);
    console.log(`     got:      [${labels.join(", ")}]`);
  } else {
    passed++;
  }

  if (matches.length > 0) {
    const r = redact(c.text);
    const preview =
      r.redacted.length > 100 ? r.redacted.slice(0, 100) + "…" : r.redacted;
    console.log(`     redacted: ${preview.replace(/\n/g, " ⏎ ")}`);
  }
}

console.log("");
console.log(`${passed} passed, ${failed} failed (${cases.length} total)`);
process.exit(failed === 0 ? 0 : 1);

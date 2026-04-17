export type DetectorId =
  | "email"
  | "creditCard"
  | "openaiKey"
  | "anthropicKey"
  | "awsAccessKey"
  | "githubToken"
  | "googleApiKey"
  | "stripeKey"
  | "slackToken"
  | "jwt"
  | "privateKey"
  | "phone"
  | "ssn"
  | "ipv4";

export interface Match {
  detector: DetectorId;
  label: string;
  start: number;
  end: number;
  value: string;
}

export interface Detector {
  id: DetectorId;
  label: string;
  detect(text: string): Match[];
}

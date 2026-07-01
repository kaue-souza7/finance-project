export type ContributionType = "unique" | "recurring";
export type TimeUnit = "months" | "years";

export interface EsporadicContribution {
  id: string;
  type: ContributionType;
  value: number;
  period: number;
  description: string;
}

export interface InvestmentConfig {
  initialValue: number;
  monthlyValue: number;
  yearlyInterestRate: number;
  timeValue: number;
  timeUnit: TimeUnit;
}

export interface AdvancedConfig {
  correctionValue: number;
  managementFee: number;
  taxation: number;
}

export interface SimulationInput {
  investment: InvestmentConfig;
  contributions: EsporadicContribution[];
  advanced: AdvancedConfig;
}

export interface MonthResult {
  month: number;
  year: number;
  totalInvested: number;
  balance: number;
  grossYield: number;
  feeAmount: number;
  taxAmount: number;
  netYield: number;
}

export interface SimulationResult {
  months: MonthResult[];
  totalInvested: number;
  totalYield: number;
  finalBalance: number;
  totalFees: number;
  totalTaxes: number;
}

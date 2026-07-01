import { useMemo } from "react";
import type { SimulationInput, SimulationResult } from "@/types/simulator";

function monthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
}

export function calculateCompoundInterest(input: SimulationInput): SimulationResult | null {
  const { investment, contributions, advanced } = input;
  const { initialValue, monthlyValue, yearlyInterestRate, timeValue, timeUnit } = investment;

  if (timeValue <= 0 || yearlyInterestRate <= 0) return null;

  const totalMonths = timeUnit === "years" ? timeValue * 12 : timeValue;
  const mr = monthlyRate(yearlyInterestRate);
  const monthlyFee = advanced.managementFee / 100 / 12;
  const correctionRate = advanced.correctionValue / 100;

  const months: SimulationResult["months"] = [];
  let balance = initialValue;
  let totalInvested = initialValue;
  let totalFees = 0;
  let totalTaxes = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const year = Math.ceil(m / 12);

    const correctionMultiplier = Math.pow(1 + correctionRate, year - 1);
    const adjustedMonthly = monthlyValue * correctionMultiplier;

    let esporadicValue = 0;
    for (const c of contributions) {
      if (c.type === "unique" && c.period === m) {
        esporadicValue += c.value;
      } else if (c.type === "recurring") {
        const monthOfYear = ((m - 1) % 12) + 1;
        if (monthOfYear === c.period) {
          esporadicValue += c.value;
        }
      }
    }

    const totalAdded = adjustedMonthly + esporadicValue;
    balance += totalAdded;
    totalInvested += totalAdded;

    const grossYield = balance * mr;
    const fee = balance * monthlyFee;
    const netBeforeTax = grossYield - fee;
    const gains = netBeforeTax > 0 ? netBeforeTax : 0;
    const tax = gains * (advanced.taxation / 100);

    balance += netBeforeTax - tax;
    totalFees += fee;
    totalTaxes += tax;

    months.push({
      month: m,
      year,
      totalInvested,
      balance,
      grossYield,
      feeAmount: fee,
      taxAmount: tax,
      netYield: netBeforeTax - tax,
    });
  }

  const finalBalance = balance;
  const totalYield = finalBalance - totalInvested;

  return {
    months,
    totalInvested,
    totalYield,
    finalBalance,
    totalFees,
    totalTaxes,
  };
}

export function useCompoundInterest(input: SimulationInput): SimulationResult | null {
  return useMemo(() => calculateCompoundInterest(input), [input]);
}

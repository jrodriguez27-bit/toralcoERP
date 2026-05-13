import { prisma } from '@/lib/prisma'
import Decimal from 'decimal.js'

interface PayrollCalculation {
  baseSalary: string
  overtimeHours: number
  overtimeAmount: string
  bonuses: string
  grossPay: string
  afpEmployee: string
  sfsEmployee: string
  isrAmount: string
  otherDeductions: string
  totalDeductions: string
  netPay: string
  afpEmployer: string
  sfsEmployer: string
  srlEmployer: string
  infotepEmployer: string
  totalEmployerCost: string
}

export async function calculatePayroll(
  baseSalary: string | number,
  overtimeHours: number = 0,
  bonuses: string | number = '0'
): Promise<PayrollCalculation> {
  // Get fiscal config
  const configs = await prisma.fiscalConfig.findMany()
  const configMap: Record<string, string> = {}
  configs.forEach((c) => { configMap[c.key] = c.value })

  const salary = new Decimal(String(baseSalary))
  const hourlyRate = salary.div(23.83).div(8) // Dominican labor law: 23.83 days, 8 hours
  const overtimeRate = hourlyRate.mul(1.35) // 35% extra for daytime overtime
  const overtimeAmount = overtimeRate.mul(overtimeHours)
  const bonusAmount = new Decimal(String(bonuses))

  const grossPay = salary.plus(overtimeAmount).plus(bonusAmount)

  // TSS calculations with caps
  const afpCap = new Decimal(configMap['AFP_SALARY_CAP'] || '362541.60')
  const sfsCap = new Decimal(configMap['SFS_SALARY_CAP'] || '362541.60')

  const afpBase = Decimal.min(grossPay, afpCap)
  const sfsBase = Decimal.min(grossPay, sfsCap)

  const afpEmployeeRate = new Decimal(configMap['AFP_EMPLOYEE_RATE'] || '0.0287')
  const sfsEmployeeRate = new Decimal(configMap['SFS_EMPLOYEE_RATE'] || '0.0304')
  const afpEmployerRate = new Decimal(configMap['AFP_EMPLOYER_RATE'] || '0.0710')
  const sfsEmployerRate = new Decimal(configMap['SFS_EMPLOYER_RATE'] || '0.0709')
  const srlRate = new Decimal(configMap['SRL_EMPLOYER_RATE'] || '0.011')
  const infotepRate = new Decimal(configMap['INFOTEP_EMPLOYER_RATE'] || '0.01')

  const afpEmployee = afpBase.mul(afpEmployeeRate)
  const sfsEmployee = sfsBase.mul(sfsEmployeeRate)

  // ISR calculation - Dominican progressive table (annual)
  const annualGross = grossPay.mul(12)
  const annualAfp = afpEmployee.mul(12)
  const annualSfs = sfsEmployee.mul(12)
  const taxableIncome = annualGross.minus(annualAfp).minus(annualSfs)

  let annualIsr = new Decimal(0)
  if (taxableIncome.gt(867123.01)) {
    annualIsr = taxableIncome.minus(867123.01).mul(0.25).plus(79776)
  } else if (taxableIncome.gt(631591.01)) {
    annualIsr = taxableIncome.minus(631591.01).mul(0.20).plus(32720.67)
  } else if (taxableIncome.gt(416220.01)) {
    annualIsr = taxableIncome.minus(416220.01).mul(0.15)
  }
  const monthlyIsr = annualIsr.div(12)

  const totalDeductions = afpEmployee.plus(sfsEmployee).plus(monthlyIsr)
  const netPay = grossPay.minus(totalDeductions)

  // Employer contributions
  const afpEmployer = afpBase.mul(afpEmployerRate)
  const sfsEmployer = sfsBase.mul(sfsEmployerRate)
  const srlEmployer = grossPay.mul(srlRate)
  const infotepEmployer = grossPay.mul(infotepRate)
  const totalEmployerCost = grossPay.plus(afpEmployer).plus(sfsEmployer).plus(srlEmployer).plus(infotepEmployer)

  return {
    baseSalary: salary.toFixed(2),
    overtimeHours,
    overtimeAmount: overtimeAmount.toFixed(2),
    bonuses: bonusAmount.toFixed(2),
    grossPay: grossPay.toFixed(2),
    afpEmployee: afpEmployee.toFixed(2),
    sfsEmployee: sfsEmployee.toFixed(2),
    isrAmount: monthlyIsr.toFixed(2),
    otherDeductions: '0.00',
    totalDeductions: totalDeductions.toFixed(2),
    netPay: netPay.toFixed(2),
    afpEmployer: afpEmployer.toFixed(2),
    sfsEmployer: sfsEmployer.toFixed(2),
    srlEmployer: srlEmployer.toFixed(2),
    infotepEmployer: infotepEmployer.toFixed(2),
    totalEmployerCost: totalEmployerCost.toFixed(2),
  }
}

'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit.service'
import { calculatePayroll } from '@/lib/services/payroll.service'
import { createJournalEntry } from '@/lib/services/accounting.service'
import { payrollRunSchema } from '@/lib/validations/nomina'
import { generateSequentialNumber } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Decimal from 'decimal.js'

export async function createPayrollRun(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const raw = Object.fromEntries(formData.entries())
  const parsed = payrollRunSchema.parse(raw)

  const number = await generateSequentialNumber(prisma, 'PAYROLL_RUN', 'NOM')

  const run = await prisma.payrollRun.create({
    data: {
      number,
      periodStart: new Date(parsed.periodStart),
      periodEnd: new Date(parsed.periodEnd),
      type: parsed.type,
      status: 'DRAFT',
      notes: parsed.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'PayrollRun',
    entityId: run.id,
    metadata: { number: run.number },
  })

  revalidatePath('/nomina/corridas')
  redirect(`/nomina/corridas/${run.id}`)
}

export async function calculatePayrollRun(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const run = await prisma.payrollRun.findUnique({ where: { id } })
  if (!run) throw new Error('Corrida no encontrada')
  if (run.status !== 'DRAFT') throw new Error('Solo se pueden calcular corridas en borrador')

  // Delete existing details if recalculating
  await prisma.payrollDetail.deleteMany({ where: { payrollRunId: id } })

  const employees = await prisma.employee.findMany({
    where: { isActive: true, deletedAt: null },
  })

  let totalGross = new Decimal(0)
  let totalDeductions = new Decimal(0)
  let totalNet = new Decimal(0)
  let totalEmployerCost = new Decimal(0)

  for (const emp of employees) {
    const calc = await calculatePayroll(emp.baseSalary.toString(), 0, '0')

    await prisma.payrollDetail.create({
      data: {
        payrollRunId: id,
        employeeId: emp.id,
        baseSalary: calc.baseSalary,
        overtimeHours: calc.overtimeHours,
        overtimeAmount: calc.overtimeAmount,
        bonuses: calc.bonuses,
        grossPay: calc.grossPay,
        afpEmployee: calc.afpEmployee,
        sfsEmployee: calc.sfsEmployee,
        isrAmount: calc.isrAmount,
        otherDeductions: calc.otherDeductions,
        totalDeductions: calc.totalDeductions,
        netPay: calc.netPay,
        afpEmployer: calc.afpEmployer,
        sfsEmployer: calc.sfsEmployer,
        srlEmployer: calc.srlEmployer,
        infotepEmployer: calc.infotepEmployer,
        totalEmployerCost: calc.totalEmployerCost,
      },
    })

    totalGross = totalGross.plus(calc.grossPay)
    totalDeductions = totalDeductions.plus(calc.totalDeductions)
    totalNet = totalNet.plus(calc.netPay)
    totalEmployerCost = totalEmployerCost.plus(calc.totalEmployerCost)
  }

  await prisma.payrollRun.update({
    where: { id },
    data: {
      status: 'CALCULATED',
      totalGross: totalGross.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      totalNet: totalNet.toFixed(2),
      totalEmployerCost: totalEmployerCost.toFixed(2),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CALCULATE',
    entity: 'PayrollRun',
    entityId: id,
    metadata: { employees: employees.length, totalGross: totalGross.toFixed(2) },
  })

  revalidatePath(`/nomina/corridas/${id}`)
  revalidatePath('/nomina/corridas')
}

export async function approvePayrollRun(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const run = await prisma.payrollRun.findUnique({ where: { id } })
  if (!run) throw new Error('Corrida no encontrada')
  if (run.status !== 'CALCULATED') throw new Error('Solo se pueden aprobar corridas calculadas')

  await prisma.payrollRun.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'APPROVE',
    entity: 'PayrollRun',
    entityId: id,
    metadata: { number: run.number },
  })

  revalidatePath(`/nomina/corridas/${id}`)
  revalidatePath('/nomina/corridas')
}

export async function postPayrollRun(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const run = await prisma.payrollRun.findUnique({
    where: { id },
    include: { details: true },
  })
  if (!run) throw new Error('Corrida no encontrada')
  if (run.status !== 'APPROVED') throw new Error('Solo se pueden contabilizar corridas aprobadas')

  // Aggregate totals for journal entry
  let totalAfpEmployee = new Decimal(0)
  let totalSfsEmployee = new Decimal(0)
  let totalIsr = new Decimal(0)
  let totalAfpEmployer = new Decimal(0)
  let totalSfsEmployer = new Decimal(0)
  let totalSrlEmployer = new Decimal(0)
  let totalInfotepEmployer = new Decimal(0)
  let totalNetPay = new Decimal(0)
  let totalGrossPay = new Decimal(0)

  for (const d of run.details) {
    totalAfpEmployee = totalAfpEmployee.plus(d.afpEmployee.toString())
    totalSfsEmployee = totalSfsEmployee.plus(d.sfsEmployee.toString())
    totalIsr = totalIsr.plus(d.isrAmount.toString())
    totalAfpEmployer = totalAfpEmployer.plus(d.afpEmployer.toString())
    totalSfsEmployer = totalSfsEmployer.plus(d.sfsEmployer.toString())
    totalSrlEmployer = totalSrlEmployer.plus(d.srlEmployer.toString())
    totalInfotepEmployer = totalInfotepEmployer.plus(d.infotepEmployer.toString())
    totalNetPay = totalNetPay.plus(d.netPay.toString())
    totalGrossPay = totalGrossPay.plus(d.grossPay.toString())
  }

  const totalEmployerContribs = totalAfpEmployer.plus(totalSfsEmployer).plus(totalSrlEmployer).plus(totalInfotepEmployer)

  // Find accounts by code pattern - salary expense, employer contributions, liabilities
  const accounts = await prisma.accountCatalog.findMany({
    where: {
      code: {
        in: [
          '5101', // Gastos de Salarios
          '5102', // Contribuciones Patronales
          '2103', // AFP por pagar
          '2104', // SFS por pagar
          '2105', // ISR por pagar (retenciones)
          '2106', // SRL por pagar
          '2107', // INFOTEP por pagar
          '2108', // Sueldos por pagar
        ],
      },
    },
  })

  const accountMap: Record<string, string> = {}
  accounts.forEach((a) => { accountMap[a.code] = a.id })

  // Build journal lines: Debit expenses, Credit liabilities
  const lines = []

  // Debit: Salary expense (gross pay)
  if (accountMap['5101']) {
    lines.push({
      accountId: accountMap['5101'],
      description: 'Gastos de salarios',
      debit: totalGrossPay.toFixed(2),
      credit: '0',
    })
  }

  // Debit: Employer contributions expense
  if (accountMap['5102']) {
    lines.push({
      accountId: accountMap['5102'],
      description: 'Contribuciones patronales (AFP, SFS, SRL, INFOTEP)',
      debit: totalEmployerContribs.toFixed(2),
      credit: '0',
    })
  }

  // Credit: AFP por pagar (employee + employer)
  if (accountMap['2103']) {
    lines.push({
      accountId: accountMap['2103'],
      description: 'AFP por pagar',
      debit: '0',
      credit: totalAfpEmployee.plus(totalAfpEmployer).toFixed(2),
    })
  }

  // Credit: SFS por pagar (employee + employer)
  if (accountMap['2104']) {
    lines.push({
      accountId: accountMap['2104'],
      description: 'SFS por pagar',
      debit: '0',
      credit: totalSfsEmployee.plus(totalSfsEmployer).toFixed(2),
    })
  }

  // Credit: ISR por pagar
  if (accountMap['2105']) {
    lines.push({
      accountId: accountMap['2105'],
      description: 'ISR retenido por pagar',
      debit: '0',
      credit: totalIsr.toFixed(2),
    })
  }

  // Credit: SRL por pagar
  if (accountMap['2106']) {
    lines.push({
      accountId: accountMap['2106'],
      description: 'SRL por pagar',
      debit: '0',
      credit: totalSrlEmployer.toFixed(2),
    })
  }

  // Credit: INFOTEP por pagar
  if (accountMap['2107']) {
    lines.push({
      accountId: accountMap['2107'],
      description: 'INFOTEP por pagar',
      debit: '0',
      credit: totalInfotepEmployer.toFixed(2),
    })
  }

  // Credit: Sueldos por pagar (net pay)
  if (accountMap['2108']) {
    lines.push({
      accountId: accountMap['2108'],
      description: 'Sueldos netos por pagar',
      debit: '0',
      credit: totalNetPay.toFixed(2),
    })
  }

  const journalEntryId = await createJournalEntry({
    date: run.periodEnd,
    description: `Nómina ${run.number} - Período ${run.periodStart.toLocaleDateString('es-DO')} al ${run.periodEnd.toLocaleDateString('es-DO')}`,
    type: 'AUTOMATIC',
    referenceType: 'PAYROLL_RUN',
    referenceId: id,
    reference: run.number,
    lines,
  })

  await prisma.payrollRun.update({
    where: { id },
    data: {
      status: 'POSTED',
      journalEntryId,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'POST',
    entity: 'PayrollRun',
    entityId: id,
    metadata: { number: run.number, journalEntryId },
  })

  revalidatePath(`/nomina/corridas/${id}`)
  revalidatePath('/nomina/corridas')
}

export async function deletePayrollRun(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const run = await prisma.payrollRun.findUnique({ where: { id } })
  if (!run) throw new Error('Corrida no encontrada')
  if (run.status !== 'DRAFT') throw new Error('Solo se pueden eliminar corridas en borrador')

  // Cascade deletes details due to schema onDelete: Cascade
  await prisma.payrollRun.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'PayrollRun',
    entityId: id,
    metadata: { number: run.number },
  })

  revalidatePath('/nomina/corridas')
  redirect('/nomina/corridas')
}

export async function updatePayrollDetail(
  detailId: string,
  data: { overtimeHours: string; bonuses: string; otherDeductions: string }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const detail = await prisma.payrollDetail.findUnique({
    where: { id: detailId },
    include: { payrollRun: true },
  })
  if (!detail) throw new Error('Detalle no encontrado')
  if (detail.payrollRun.status !== 'CALCULATED') throw new Error('Solo se pueden editar detalles de corridas calculadas')

  const overtimeHours = Number(data.overtimeHours) || 0
  const bonuses = data.bonuses || '0'
  const otherDed = new Decimal(data.otherDeductions || '0')

  const calc = await calculatePayroll(detail.baseSalary.toString(), overtimeHours, bonuses)

  // Add other deductions on top of calculated deductions
  const finalTotalDeductions = new Decimal(calc.totalDeductions).plus(otherDed)
  const finalNetPay = new Decimal(calc.grossPay).minus(finalTotalDeductions)

  await prisma.payrollDetail.update({
    where: { id: detailId },
    data: {
      overtimeHours: overtimeHours,
      overtimeAmount: calc.overtimeAmount,
      bonuses: calc.bonuses,
      grossPay: calc.grossPay,
      afpEmployee: calc.afpEmployee,
      sfsEmployee: calc.sfsEmployee,
      isrAmount: calc.isrAmount,
      otherDeductions: otherDed.toFixed(2),
      totalDeductions: finalTotalDeductions.toFixed(2),
      netPay: finalNetPay.toFixed(2),
      afpEmployer: calc.afpEmployer,
      sfsEmployer: calc.sfsEmployer,
      srlEmployer: calc.srlEmployer,
      infotepEmployer: calc.infotepEmployer,
      totalEmployerCost: calc.totalEmployerCost,
    },
  })

  // Recalculate run totals
  const allDetails = await prisma.payrollDetail.findMany({
    where: { payrollRunId: detail.payrollRunId },
  })

  let totalGross = new Decimal(0)
  let totalDeductions = new Decimal(0)
  let totalNet = new Decimal(0)
  let totalEmployerCost = new Decimal(0)

  for (const d of allDetails) {
    totalGross = totalGross.plus(d.grossPay.toString())
    totalDeductions = totalDeductions.plus(d.totalDeductions.toString())
    totalNet = totalNet.plus(d.netPay.toString())
    totalEmployerCost = totalEmployerCost.plus(d.totalEmployerCost.toString())
  }

  await prisma.payrollRun.update({
    where: { id: detail.payrollRunId },
    data: {
      totalGross: totalGross.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      totalNet: totalNet.toFixed(2),
      totalEmployerCost: totalEmployerCost.toFixed(2),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'PayrollDetail',
    entityId: detailId,
    metadata: { overtimeHours, bonuses, otherDeductions: data.otherDeductions },
  })

  revalidatePath(`/nomina/corridas/${detail.payrollRunId}`)
}

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { PayrollRunDetail } from './payroll-run-detail'

export default async function PayrollRunPage({
  params,
}: {
  params: { id: string }
}) {
  const run = await prisma.payrollRun.findUnique({
    where: { id: params.id },
    include: {
      details: {
        include: { employee: true },
        orderBy: { employee: { lastName: 'asc' } },
      },
    },
  })

  if (!run) notFound()

  const serialized = {
    id: run.id,
    number: run.number,
    periodStart: run.periodStart.toISOString(),
    periodEnd: run.periodEnd.toISOString(),
    type: run.type,
    status: run.status,
    totalGross: run.totalGross.toString(),
    totalDeductions: run.totalDeductions.toString(),
    totalNet: run.totalNet.toString(),
    totalEmployerCost: run.totalEmployerCost.toString(),
    notes: run.notes,
    journalEntryId: run.journalEntryId,
    details: run.details.map((d) => ({
      id: d.id,
      employeeId: d.employeeId,
      employeeName: `${d.employee.firstName} ${d.employee.lastName}`,
      employeeCode: d.employee.code,
      baseSalary: d.baseSalary.toString(),
      overtimeHours: d.overtimeHours.toString(),
      overtimeAmount: d.overtimeAmount.toString(),
      bonuses: d.bonuses.toString(),
      grossPay: d.grossPay.toString(),
      afpEmployee: d.afpEmployee.toString(),
      sfsEmployee: d.sfsEmployee.toString(),
      isrAmount: d.isrAmount.toString(),
      otherDeductions: d.otherDeductions.toString(),
      totalDeductions: d.totalDeductions.toString(),
      netPay: d.netPay.toString(),
      afpEmployer: d.afpEmployer.toString(),
      sfsEmployer: d.sfsEmployer.toString(),
      srlEmployer: d.srlEmployer.toString(),
      infotepEmployer: d.infotepEmployer.toString(),
      totalEmployerCost: d.totalEmployerCost.toString(),
    })),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Corrida ${run.number}`}
        description={`Período: ${run.periodStart.toLocaleDateString('es-DO')} - ${run.periodEnd.toLocaleDateString('es-DO')}`}
      />
      <PayrollRunDetail run={serialized} />
    </div>
  )
}

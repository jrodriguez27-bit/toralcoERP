import ExcelJS from 'exceljs'

export async function createExcelWorkbook(
  sheetName: string,
  columns: { header: string; key: string; width?: number }[],
  data: Record<string, unknown>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ToralcoERP'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(sheetName)

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }))

  // Style header row
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  }
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

  // Add data
  data.forEach((row) => {
    worksheet.addRow(row)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

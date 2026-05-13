import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ============================================================
  // USERS
  // ============================================================
  const password = await bcrypt.hash('admin123', 10)

  const users = [
    { name: 'Administrador', email: 'admin@empresa.com', role: Role.ADMIN },
    { name: 'Gerente General', email: 'gerente@empresa.com', role: Role.GERENTE },
    { name: 'María Contadora', email: 'contador@empresa.com', role: Role.CONTADOR },
    { name: 'Juan Compras', email: 'compras@empresa.com', role: Role.COMPRAS },
    { name: 'Pedro Almacén', email: 'almacen@empresa.com', role: Role.ALMACEN },
    { name: 'Ana RRHH', email: 'rrhh@empresa.com', role: Role.RRHH },
    { name: 'Carlos Ventas', email: 'ventas@empresa.com', role: Role.VENTAS },
    { name: 'Luis Proyectos', email: 'proyectos@empresa.com', role: Role.PROYECTOS },
    { name: 'Rosa Visor', email: 'visor@empresa.com', role: Role.VIEWER },
    { name: 'Ing. Roberto Torres', email: 'rtorres@empresa.com', role: Role.GERENTE },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password },
    })
  }
  console.log('  Users seeded')

  // ============================================================
  // COMPANY
  // ============================================================
  await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      name: 'Toralco Constructora SRL',
      rnc: '131-12345-6',
      address: 'Av. Winston Churchill #123, Santo Domingo, RD',
      phone: '809-555-1234',
      email: 'info@toralco.com',
    },
  })
  console.log('  Company seeded')

  // ============================================================
  // FISCAL CONFIG
  // ============================================================
  const fiscalConfigs = [
    { key: 'ITBIS_RATE', value: '0.18', description: 'Tasa ITBIS estándar' },
    { key: 'ISR_RETENTION_SERVICES', value: '0.10', description: 'Retención ISR servicios' },
    { key: 'ISR_RETENTION_RENT', value: '0.10', description: 'Retención ISR alquileres' },
    { key: 'ITBIS_RETENTION_RATE', value: '0.30', description: 'Proporción retención ITBIS (30% del ITBIS)' },
    { key: 'AFP_EMPLOYEE_RATE', value: '0.0287', description: 'AFP empleado 2.87%' },
    { key: 'AFP_EMPLOYER_RATE', value: '0.0710', description: 'AFP patronal 7.10%' },
    { key: 'SFS_EMPLOYEE_RATE', value: '0.0304', description: 'SFS empleado 3.04%' },
    { key: 'SFS_EMPLOYER_RATE', value: '0.0709', description: 'SFS patronal 7.09%' },
    { key: 'SRL_EMPLOYER_RATE', value: '0.011', description: 'SRL patronal 1.1%' },
    { key: 'INFOTEP_EMPLOYER_RATE', value: '0.01', description: 'INFOTEP patronal 1.0%' },
    { key: 'AFP_SALARY_CAP', value: '362541.60', description: 'Tope salarial cotizable AFP (mensual)' },
    { key: 'SFS_SALARY_CAP', value: '362541.60', description: 'Tope salarial cotizable SFS (mensual)' },
  ]

  for (const fc of fiscalConfigs) {
    await prisma.fiscalConfig.upsert({
      where: { key: fc.key },
      update: { value: fc.value },
      create: fc,
    })
  }
  console.log('  Fiscal config seeded')

  // ============================================================
  // CHART OF ACCOUNTS
  // ============================================================
  const accounts = [
    // Activos
    { code: '1', name: 'ACTIVOS', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 1, acceptsEntries: false },
    { code: '1.1', name: 'Activo Corriente', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 2, parentCode: '1', acceptsEntries: false },
    { code: '1.1.01', name: 'Efectivo y Equivalentes', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 3, parentCode: '1.1', acceptsEntries: false },
    { code: '1.1.01.001', name: 'Caja General', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.1.01' },
    { code: '1.1.01.002', name: 'Banco Popular', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.1.01' },
    { code: '1.1.01.003', name: 'Banco Reservas', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.1.01' },
    { code: '1.1.02', name: 'Cuentas por Cobrar', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 3, parentCode: '1.1', acceptsEntries: false },
    { code: '1.1.02.001', name: 'CxC Clientes', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.1.02' },
    { code: '1.1.02.002', name: 'CxC Empleados', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.1.02' },
    { code: '1.1.03', name: 'Inventarios', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 3, parentCode: '1.1', acceptsEntries: false },
    { code: '1.1.03.001', name: 'Inventario Materiales', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.1.03' },
    { code: '1.1.04', name: 'Anticipos e ITBIS', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 3, parentCode: '1.1', acceptsEntries: false },
    { code: '1.1.04.001', name: 'ITBIS Pagado', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.1.04' },
    { code: '1.2', name: 'Activo No Corriente', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 2, parentCode: '1', acceptsEntries: false },
    { code: '1.2.01', name: 'Propiedad, Planta y Equipo', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 3, parentCode: '1.2', acceptsEntries: false },
    { code: '1.2.01.001', name: 'Terrenos', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.2.01' },
    { code: '1.2.01.002', name: 'Edificaciones', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.2.01' },
    { code: '1.2.01.003', name: 'Maquinaria y Equipo', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.2.01' },
    { code: '1.2.01.004', name: 'Vehículos', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.2.01' },
    { code: '1.2.01.005', name: 'Mobiliario y Equipo Oficina', type: 'ASSET' as const, nature: 'DEBIT' as const, level: 4, parentCode: '1.2.01' },
    { code: '1.2.02', name: 'Depreciación Acumulada', type: 'ASSET' as const, nature: 'CREDIT' as const, level: 3, parentCode: '1.2', acceptsEntries: false },
    { code: '1.2.02.001', name: 'Dep. Acum. Edificaciones', type: 'ASSET' as const, nature: 'CREDIT' as const, level: 4, parentCode: '1.2.02' },
    { code: '1.2.02.002', name: 'Dep. Acum. Maquinaria', type: 'ASSET' as const, nature: 'CREDIT' as const, level: 4, parentCode: '1.2.02' },
    { code: '1.2.02.003', name: 'Dep. Acum. Vehículos', type: 'ASSET' as const, nature: 'CREDIT' as const, level: 4, parentCode: '1.2.02' },
    { code: '1.2.02.004', name: 'Dep. Acum. Mobiliario', type: 'ASSET' as const, nature: 'CREDIT' as const, level: 4, parentCode: '1.2.02' },

    // Pasivos
    { code: '2', name: 'PASIVOS', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 1, acceptsEntries: false },
    { code: '2.1', name: 'Pasivo Corriente', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 2, parentCode: '2', acceptsEntries: false },
    { code: '2.1.01', name: 'Cuentas por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 3, parentCode: '2.1', acceptsEntries: false },
    { code: '2.1.01.001', name: 'CxP Proveedores', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.01' },
    { code: '2.1.01.002', name: 'CxP Subcontratistas', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.01' },
    { code: '2.1.02', name: 'Impuestos por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 3, parentCode: '2.1', acceptsEntries: false },
    { code: '2.1.02.001', name: 'ITBIS por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.02' },
    { code: '2.1.02.002', name: 'ISR Retenido por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.02' },
    { code: '2.1.02.003', name: 'ISR Empleados por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.02' },
    { code: '2.1.03', name: 'Nómina por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 3, parentCode: '2.1', acceptsEntries: false },
    { code: '2.1.03.001', name: 'Sueldos por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.03' },
    { code: '2.1.03.002', name: 'AFP por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.03' },
    { code: '2.1.03.003', name: 'SFS por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.03' },
    { code: '2.1.03.004', name: 'SRL por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.03' },
    { code: '2.1.03.005', name: 'INFOTEP por Pagar', type: 'LIABILITY' as const, nature: 'CREDIT' as const, level: 4, parentCode: '2.1.03' },

    // Patrimonio
    { code: '3', name: 'PATRIMONIO', type: 'EQUITY' as const, nature: 'CREDIT' as const, level: 1, acceptsEntries: false },
    { code: '3.1', name: 'Capital Social', type: 'EQUITY' as const, nature: 'CREDIT' as const, level: 2, parentCode: '3', acceptsEntries: false },
    { code: '3.1.01', name: 'Capital Suscrito y Pagado', type: 'EQUITY' as const, nature: 'CREDIT' as const, level: 3, parentCode: '3.1' },
    { code: '3.2', name: 'Resultados Acumulados', type: 'EQUITY' as const, nature: 'CREDIT' as const, level: 2, parentCode: '3', acceptsEntries: false },
    { code: '3.2.01', name: 'Utilidades Retenidas', type: 'EQUITY' as const, nature: 'CREDIT' as const, level: 3, parentCode: '3.2' },
    { code: '3.2.02', name: 'Resultado del Período', type: 'EQUITY' as const, nature: 'CREDIT' as const, level: 3, parentCode: '3.2' },

    // Ingresos
    { code: '4', name: 'INGRESOS', type: 'INCOME' as const, nature: 'CREDIT' as const, level: 1, acceptsEntries: false },
    { code: '4.1', name: 'Ingresos Operacionales', type: 'INCOME' as const, nature: 'CREDIT' as const, level: 2, parentCode: '4', acceptsEntries: false },
    { code: '4.1.01', name: 'Ingresos por Construcción', type: 'INCOME' as const, nature: 'CREDIT' as const, level: 3, parentCode: '4.1' },
    { code: '4.1.02', name: 'Ingresos por Servicios', type: 'INCOME' as const, nature: 'CREDIT' as const, level: 3, parentCode: '4.1' },

    // Costos
    { code: '5', name: 'COSTOS', type: 'COST' as const, nature: 'DEBIT' as const, level: 1, acceptsEntries: false },
    { code: '5.1', name: 'Costo de Construcción', type: 'COST' as const, nature: 'DEBIT' as const, level: 2, parentCode: '5', acceptsEntries: false },
    { code: '5.1.01', name: 'Materiales Directos', type: 'COST' as const, nature: 'DEBIT' as const, level: 3, parentCode: '5.1' },
    { code: '5.1.02', name: 'Mano de Obra Directa', type: 'COST' as const, nature: 'DEBIT' as const, level: 3, parentCode: '5.1' },
    { code: '5.1.03', name: 'Costos Indirectos', type: 'COST' as const, nature: 'DEBIT' as const, level: 3, parentCode: '5.1' },
    { code: '5.1.04', name: 'Subcontratos', type: 'COST' as const, nature: 'DEBIT' as const, level: 3, parentCode: '5.1' },

    // Gastos
    { code: '6', name: 'GASTOS', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 1, acceptsEntries: false },
    { code: '6.1', name: 'Gastos Administrativos', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 2, parentCode: '6', acceptsEntries: false },
    { code: '6.1.01', name: 'Sueldos Administrativos', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.1' },
    { code: '6.1.02', name: 'Beneficios Empleados', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.1' },
    { code: '6.1.03', name: 'Alquiler Oficina', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.1' },
    { code: '6.1.04', name: 'Servicios Públicos', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.1' },
    { code: '6.1.05', name: 'Depreciación', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.1' },
    { code: '6.1.06', name: 'Seguros', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.1' },
    { code: '6.1.07', name: 'Gastos Legales', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.1' },
    { code: '6.1.08', name: 'Gastos de Oficina', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.1' },
    { code: '6.2', name: 'Gastos Financieros', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 2, parentCode: '6', acceptsEntries: false },
    { code: '6.2.01', name: 'Intereses Bancarios', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.2' },
    { code: '6.2.02', name: 'Comisiones Bancarias', type: 'EXPENSE' as const, nature: 'DEBIT' as const, level: 3, parentCode: '6.2' },
  ]

  // Build a map of code -> id
  const accountMap: Record<string, string> = {}
  for (const acc of accounts) {
    const parentId = acc.parentCode ? accountMap[acc.parentCode] : null
    const created = await prisma.accountCatalog.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        nature: acc.nature,
        level: acc.level,
        parentId: parentId || undefined,
        acceptsEntries: acc.acceptsEntries ?? true,
      },
    })
    accountMap[acc.code] = created.id
  }
  console.log('  Chart of accounts seeded')

  // ============================================================
  // COST CODES
  // ============================================================
  const costCodes = [
    { code: '01.01', name: 'Preliminares', accountCode: '5.1.01' },
    { code: '01.02', name: 'Movimiento de Tierra', accountCode: '5.1.01' },
    { code: '02.01', name: 'Hormigón Estructural', accountCode: '5.1.01' },
    { code: '02.02', name: 'Acero de Refuerzo', accountCode: '5.1.01' },
    { code: '03.01', name: 'Muros y Paredes', accountCode: '5.1.01' },
    { code: '03.02', name: 'Terminación de Superficies', accountCode: '5.1.01' },
    { code: '04.01', name: 'Instalaciones Eléctricas', accountCode: '5.1.03' },
    { code: '04.02', name: 'Instalaciones Sanitarias', accountCode: '5.1.03' },
    { code: '05.01', name: 'Mano de Obra - Estructura', accountCode: '5.1.02' },
    { code: '05.02', name: 'Mano de Obra - Terminación', accountCode: '5.1.02' },
    { code: '06.01', name: 'Subcontrato General', accountCode: '5.1.04' },
    { code: '07.01', name: 'Gastos Generales Proyecto', accountCode: '5.1.03' },
  ]

  for (const cc of costCodes) {
    await prisma.costCode.upsert({
      where: { code: cc.code },
      update: {},
      create: {
        code: cc.code,
        name: cc.name,
        accountId: accountMap[cc.accountCode] || undefined,
      },
    })
  }
  console.log('  Cost codes seeded')

  // ============================================================
  // CLIENTS
  // ============================================================
  const clients = [
    { code: 'CLI-001', name: 'Inversiones Del Caribe SRL', rnc: '101-23456-7', contactName: 'Roberto Martínez', phone: '809-555-0001', email: 'rmartinez@invcaribe.com' },
    { code: 'CLI-002', name: 'Grupo Inmobiliario Nacional SA', rnc: '102-34567-8', contactName: 'Alicia Fernández', phone: '809-555-0002', email: 'afernandez@gin.com' },
    { code: 'CLI-003', name: 'Desarrollos Urbanos Quisqueya', rnc: '103-45678-9', contactName: 'Miguel Santos', phone: '809-555-0003', email: 'msantos@duq.com' },
    { code: 'CLI-004', name: 'Constructora Horizonte SRL', rnc: '104-56789-0', contactName: 'Laura Reyes', phone: '809-555-0004', email: 'lreyes@horizonte.com' },
    { code: 'CLI-005', name: 'Residencial Las Palmas SA', rnc: '105-67890-1', contactName: 'José García', phone: '809-555-0005', email: 'jgarcia@laspalmas.com' },
  ]

  for (const c of clients) {
    await prisma.client.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    })
  }
  console.log('  Clients seeded')

  // ============================================================
  // SUPPLIERS
  // ============================================================
  const suppliers = [
    { code: 'PROV-001', name: 'Ferretería Nacional SRL', rnc: '201-11111-1', contactName: 'Pedro Díaz', phone: '809-555-1001', email: 'ventas@ferreterianacional.com', paymentTermDays: 30 },
    { code: 'PROV-002', name: 'Aceros del Caribe SA', rnc: '202-22222-2', contactName: 'Ana Mejía', phone: '809-555-1002', email: 'amejia@aceroscaribe.com', paymentTermDays: 45 },
    { code: 'PROV-003', name: 'Concretos Premezclados RD', rnc: '203-33333-3', contactName: 'Marcos López', phone: '809-555-1003', email: 'mlopez@concretosrd.com', paymentTermDays: 15 },
    { code: 'PROV-004', name: 'Materiales Eléctricos Dominicanos', rnc: '204-44444-4', contactName: 'Sofía Hernández', phone: '809-555-1004', email: 'shernandez@matelectrd.com', paymentTermDays: 30 },
    { code: 'PROV-005', name: 'Maderas y Acabados SRL', rnc: '205-55555-5', contactName: 'Carlos Vargas', phone: '809-555-1005', email: 'cvargas@maderasacabados.com', paymentTermDays: 30 },
    { code: 'PROV-006', name: 'Pinturas Caribeñas SA', rnc: '206-66666-6', contactName: 'Diana Morales', phone: '809-555-1006', email: 'dmorales@pinturascaribe.com', paymentTermDays: 30 },
  ]

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    })
  }
  console.log('  Suppliers seeded')

  // ============================================================
  // WAREHOUSES
  // ============================================================
  const warehouses = [
    { code: 'ALM-CENTRAL', name: 'Almacén Central', address: 'Zona Industrial Hainamosa, Santo Domingo Este' },
    { code: 'ALM-OBRA1', name: 'Almacén Obra Torre Norte', address: 'Av. Anacaona, Proyecto Torre Norte' },
    { code: 'ALM-OBRA2', name: 'Almacén Obra Residencial Sur', address: 'Los Alcarrizos, Proyecto Residencial Sur' },
    { code: 'ALM-EQUIPO', name: 'Almacén de Equipos', address: 'Zona Industrial Hainamosa, Santo Domingo Este' },
    { code: 'ALM-OFICINA', name: 'Almacén Oficina', address: 'Av. Winston Churchill #123' },
  ]

  for (const w of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: w.code },
      update: {},
      create: w,
    })
  }
  console.log('  Warehouses seeded')

  // ============================================================
  // PRODUCTS / MATERIALS
  // ============================================================
  const products = [
    { code: 'MAT-001', name: 'Cemento Gris Portland (Funda 42.5kg)', unit: 'FD', category: 'Cementos', minStock: 100, lastCost: 385, averageCost: 385 },
    { code: 'MAT-002', name: 'Varilla Corrugada 3/8"', unit: 'QQ', category: 'Acero', minStock: 50, lastCost: 3200, averageCost: 3200 },
    { code: 'MAT-003', name: 'Varilla Corrugada 1/2"', unit: 'QQ', category: 'Acero', minStock: 50, lastCost: 3400, averageCost: 3400 },
    { code: 'MAT-004', name: 'Arena Lavada', unit: 'M3', category: 'Agregados', minStock: 20, lastCost: 1800, averageCost: 1800 },
    { code: 'MAT-005', name: 'Grava 3/4"', unit: 'M3', category: 'Agregados', minStock: 20, lastCost: 2200, averageCost: 2200 },
    { code: 'MAT-006', name: 'Block 6"', unit: 'UND', category: 'Bloques', minStock: 500, lastCost: 38, averageCost: 38 },
    { code: 'MAT-007', name: 'Block 8"', unit: 'UND', category: 'Bloques', minStock: 500, lastCost: 52, averageCost: 52 },
    { code: 'MAT-008', name: 'Alambre de Amarre #18', unit: 'LB', category: 'Acero', minStock: 100, lastCost: 65, averageCost: 65 },
    { code: 'MAT-009', name: 'Plywood 4x8 (3/4")', unit: 'PL', category: 'Madera', minStock: 30, lastCost: 2800, averageCost: 2800 },
    { code: 'MAT-010', name: 'Tubo PVC 4" SDR-41', unit: 'UND', category: 'Plomería', minStock: 20, lastCost: 420, averageCost: 420 },
    { code: 'MAT-011', name: 'Cable #12 THHN', unit: 'RL', category: 'Eléctrico', minStock: 10, lastCost: 3500, averageCost: 3500 },
    { code: 'MAT-012', name: 'Pintura Latex Blanca (5GL)', unit: 'CU', category: 'Pinturas', minStock: 10, lastCost: 4200, averageCost: 4200 },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        unit: p.unit,
        category: p.category,
        minStock: p.minStock,
        lastCost: p.lastCost,
        averageCost: p.averageCost,
      },
    })
  }
  console.log('  Products seeded')

  // ============================================================
  // PROJECTS
  // ============================================================
  const cli1 = await prisma.client.findUnique({ where: { code: 'CLI-001' } })
  const cli2 = await prisma.client.findUnique({ where: { code: 'CLI-002' } })
  const cli3 = await prisma.client.findUnique({ where: { code: 'CLI-003' } })

  const projects = [
    { code: 'PROY-001', name: 'Torre Norte - Edificio Residencial', clientId: cli1?.id, status: 'ACTIVE' as const, startDate: new Date('2024-01-15'), endDate: new Date('2025-06-30') },
    { code: 'PROY-002', name: 'Residencial Las Brisas - Fase 1', clientId: cli2?.id, status: 'ACTIVE' as const, startDate: new Date('2024-03-01'), endDate: new Date('2025-09-30') },
    { code: 'PROY-003', name: 'Centro Comercial Plaza Este', clientId: cli3?.id, status: 'PLANNING' as const, startDate: new Date('2024-06-01') },
    { code: 'PROY-004', name: 'Nave Industrial Zona Franca', clientId: cli1?.id, status: 'PLANNING' as const },
    { code: 'PROY-005', name: 'Remodelación Oficinas Corporativas', clientId: cli2?.id, status: 'ACTIVE' as const, startDate: new Date('2024-02-01'), endDate: new Date('2024-08-31') },
  ]

  for (const p of projects) {
    await prisma.project.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        clientId: p.clientId || undefined,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
      },
    })
  }
  console.log('  Projects seeded')

  // ============================================================
  // DOCUMENT SEQUENCES
  // ============================================================
  const sequences = [
    { type: 'REQUISITION', prefix: 'REQ', year: 2024 },
    { type: 'PURCHASE_ORDER', prefix: 'OC', year: 2024 },
    { type: 'SUPPLIER_INVOICE', prefix: 'FP', year: 2024 },
    { type: 'PAYMENT', prefix: 'PAG', year: 2024 },
    { type: 'CLIENT_INVOICE', prefix: 'FAC', year: 2024 },
    { type: 'CREDIT_NOTE', prefix: 'NC', year: 2024 },
    { type: 'COLLECTION', prefix: 'COB', year: 2024 },
    { type: 'JOURNAL_ENTRY', prefix: 'AST', year: 2024 },
    { type: 'TRANSFER', prefix: 'TRF', year: 2024 },
    { type: 'PAYROLL', prefix: 'NOM', year: 2024 },
    { type: 'PROPOSAL', prefix: 'PROP', year: 2024 },
  ]

  for (const s of sequences) {
    await prisma.documentSequence.upsert({
      where: { type: s.type },
      update: {},
      create: s,
    })
  }
  console.log('  Document sequences seeded')

  // ============================================================
  // NCF SEQUENCES
  // ============================================================
  const ncfSequences = [
    { type: 'B01', prefix: 'B01', rangeFrom: 1, rangeTo: 50000, currentNumber: 0 },
    { type: 'B02', prefix: 'B02', rangeFrom: 1, rangeTo: 50000, currentNumber: 0 },
    { type: 'B14', prefix: 'B14', rangeFrom: 1, rangeTo: 10000, currentNumber: 0 },
    { type: 'B15', prefix: 'B15', rangeFrom: 1, rangeTo: 10000, currentNumber: 0 },
  ]

  for (const n of ncfSequences) {
    const existing = await prisma.ncfSequence.findFirst({
      where: { type: n.type, prefix: n.prefix },
    })
    if (!existing) {
      await prisma.ncfSequence.create({ data: n })
    }
  }
  console.log('  NCF sequences seeded')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

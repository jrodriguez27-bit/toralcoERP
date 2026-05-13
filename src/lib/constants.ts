import { Role } from '@prisma/client'

export const ROLES: Record<Role, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  CONTADOR: 'Contador',
  COMPRAS: 'Compras',
  ALMACEN: 'Almacén',
  RRHH: 'Recursos Humanos',
  VENTAS: 'Ventas',
  PROYECTOS: 'Proyectos',
  VIEWER: 'Visor',
}

export const SIDEBAR_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Catálogos',
    icon: 'BookOpen',
    children: [
      { title: 'Plan de Cuentas', href: '/catalogos/cuentas' },
      { title: 'Códigos de Costo', href: '/catalogos/codigos-costo' },
      { title: 'Clientes', href: '/catalogos/clientes' },
      { title: 'Proveedores', href: '/catalogos/proveedores' },
      { title: 'Almacenes', href: '/catalogos/almacenes' },
      { title: 'Productos', href: '/catalogos/productos' },
      { title: 'Proyectos', href: '/catalogos/proyectos' },
    ],
  },
  {
    title: 'Presupuesto',
    href: '/presupuesto',
    icon: 'Calculator',
  },
  {
    title: 'Compras',
    icon: 'ShoppingCart',
    children: [
      { title: 'Requisiciones', href: '/compras/requisiciones' },
      { title: 'Órdenes de Compra', href: '/compras/ordenes-compra' },
      { title: 'Facturas Proveedor', href: '/compras/facturas-proveedor' },
      { title: 'Pagos', href: '/compras/pagos' },
      { title: 'Cuentas por Pagar', href: '/compras/cuentas-por-pagar' },
      { title: 'Conciliación', href: '/compras/conciliacion' },
    ],
  },
  {
    title: 'Inventario',
    icon: 'Package',
    children: [
      { title: 'Stock', href: '/inventario/stock' },
      { title: 'Movimientos', href: '/inventario/movimientos' },
      { title: 'Transferencias', href: '/inventario/transferencias' },
      { title: 'Consumos', href: '/inventario/consumos' },
      { title: 'Ajustes', href: '/inventario/ajustes' },
      { title: 'Kardex', href: '/inventario/kardex' },
    ],
  },
  {
    title: 'Facturación',
    icon: 'FileText',
    children: [
      { title: 'Facturas', href: '/facturacion/facturas' },
      { title: 'Secuencias NCF', href: '/facturacion/ncf' },
      { title: 'Cobros', href: '/facturacion/cobros' },
      { title: 'Notas de Crédito', href: '/facturacion/notas-credito' },
      { title: 'Reportes 606/607', href: '/facturacion/reportes' },
    ],
  },
  {
    title: 'Contabilidad',
    icon: 'Landmark',
    children: [
      { title: 'Asientos', href: '/contabilidad/asientos' },
      { title: 'Mayor General', href: '/contabilidad/mayor' },
      { title: 'Balance Comprobación', href: '/contabilidad/balance' },
      { title: 'Estado de Resultados', href: '/contabilidad/estado-resultados' },
      { title: 'Períodos', href: '/contabilidad/periodos' },
    ],
  },
  {
    title: 'Nómina',
    icon: 'Users',
    children: [
      { title: 'Empleados', href: '/nomina/empleados' },
      { title: 'Corridas', href: '/nomina/corridas' },
    ],
  },
  {
    title: 'Activos Fijos',
    icon: 'Building2',
    children: [
      { title: 'Registro', href: '/activos-fijos/registro' },
      { title: 'Depreciación', href: '/activos-fijos/depreciacion' },
      { title: 'Mantenimiento', href: '/activos-fijos/mantenimiento' },
    ],
  },
  {
    title: 'CRM',
    icon: 'Handshake',
    children: [
      { title: 'Leads', href: '/crm/leads' },
      { title: 'Pipeline', href: '/crm/pipeline' },
      { title: 'Propuestas', href: '/crm/propuestas' },
    ],
  },
  {
    title: 'Integraciones',
    href: '/integraciones',
    icon: 'Plug',
  },
  {
    title: 'Admin',
    icon: 'Settings',
    children: [
      { title: 'Usuarios', href: '/admin/usuarios' },
      { title: 'Auditoría', href: '/admin/auditoria' },
      { title: 'Configuración', href: '/admin/configuracion' },
    ],
    roles: ['ADMIN'],
  },
]

export const STATUS_COLORS: Record<string, string> = {
  // General
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-800',

  // Approval
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',

  // Budget
  CLOSED: 'bg-gray-100 text-gray-800',

  // Purchase Orders
  PARTIALLY_RECEIVED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-green-100 text-green-800',

  // Invoices
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  ISSUED: 'bg-blue-100 text-blue-800',

  // Requisitions
  PARTIALLY_CONVERTED: 'bg-blue-100 text-blue-800',
  CONVERTED: 'bg-green-100 text-green-800',

  // Journal
  POSTED: 'bg-green-100 text-green-800',
  REVERSED: 'bg-red-100 text-red-800',

  // Project
  PLANNING: 'bg-blue-100 text-blue-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',

  // Payroll
  CALCULATED: 'bg-blue-100 text-blue-800',

  // Assets
  DISPOSED: 'bg-red-100 text-red-800',
  TRANSFERRED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',

  // Transfers
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  DISPATCHED: 'bg-blue-100 text-blue-800',

  // CRM
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-purple-100 text-purple-800',
  PROPOSAL: 'bg-indigo-100 text-indigo-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',

  // Maintenance
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',

  // Proposals
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  CANCELLED: 'Cancelado',
  PENDING_APPROVAL: 'Pendiente Aprobación',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CLOSED: 'Cerrado',
  PARTIALLY_RECEIVED: 'Parcialmente Recibido',
  RECEIVED: 'Recibido',
  PENDING: 'Pendiente',
  PARTIALLY_PAID: 'Parcialmente Pagado',
  PAID: 'Pagado',
  ISSUED: 'Emitida',
  PARTIALLY_CONVERTED: 'Parcialmente Convertido',
  CONVERTED: 'Convertido',
  POSTED: 'Contabilizado',
  REVERSED: 'Reversado',
  PLANNING: 'Planificación',
  ON_HOLD: 'En Espera',
  COMPLETED: 'Completado',
  CALCULATED: 'Calculado',
  DISPOSED: 'Dado de Baja',
  TRANSFERRED: 'Transferido',
  MAINTENANCE: 'En Mantenimiento',
  REQUESTED: 'Solicitado',
  DISPATCHED: 'Despachado',
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  PROPOSAL: 'Propuesta',
  NEGOTIATION: 'Negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
  SCHEDULED: 'Programado',
  IN_PROGRESS: 'En Progreso',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  EXPIRED: 'Vencida',
}

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const publicPaths = ['/login', '/api/auth']

const rolePermissions: Record<string, string[]> = {
  ADMIN: ['*'],
  GERENTE: ['*'],
  CONTADOR: ['/dashboard', '/contabilidad', '/facturacion', '/compras/facturas-proveedor', '/compras/pagos', '/compras/cuentas-por-pagar', '/compras/conciliacion', '/nomina', '/activos-fijos', '/catalogos'],
  COMPRAS: ['/dashboard', '/compras', '/catalogos/proveedores', '/catalogos/productos', '/presupuesto', '/inventario'],
  ALMACEN: ['/dashboard', '/inventario', '/catalogos/productos', '/catalogos/almacenes', '/compras/ordenes-compra'],
  RRHH: ['/dashboard', '/nomina', '/catalogos'],
  VENTAS: ['/dashboard', '/facturacion', '/crm', '/catalogos/clientes', '/catalogos/proyectos'],
  PROYECTOS: ['/dashboard', '/presupuesto', '/compras/requisiciones', '/inventario', '/catalogos'],
  VIEWER: ['/dashboard'],
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files and API auth
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Check authentication
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check authorization
  const role = req.auth.user?.role
  if (!role) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const allowedPaths = rolePermissions[role] || []
  if (allowedPaths.includes('*')) {
    return NextResponse.next()
  }

  // Check if the current path is allowed for this role
  const isAllowed = allowedPaths.some((p) => pathname.startsWith(p))
  if (!isAllowed && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

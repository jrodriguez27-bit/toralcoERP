'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Calculator, ShoppingCart, Package,
  FileText, Landmark, Users, Building2, Handshake, Plug, Settings,
  ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SIDEBAR_ITEMS } from '@/lib/constants'
import { ScrollArea } from '@/components/ui/scroll-area'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, BookOpen, Calculator, ShoppingCart, Package,
  FileText, Landmark, Users, Building2, Handshake, Plug, Settings,
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  userRole?: string
}

export function Sidebar({ collapsed, onToggle, userRole }: SidebarProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  const filteredItems = SIDEBAR_ITEMS.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(userRole || '')
  })

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              T
            </div>
            <span className="font-semibold text-lg">ToralcoERP</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <nav className="space-y-1 p-2">
          {filteredItems.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive = item.href
              ? pathname === item.href || pathname.startsWith(item.href + '/')
              : item.children?.some(
                  (child) => pathname === child.href || pathname.startsWith(child.href + '/')
                )
            const isOpen = openMenus.includes(item.title)

            if (item.children) {
              return (
                <div key={item.title}>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      'flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {Icon && <Icon className="h-5 w-5 shrink-0" />}
                    {!collapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">{item.title}</span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && isOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l pl-4">
                      {item.children.map((child) => {
                        const isChildActive =
                          pathname === child.href ||
                          pathname.startsWith(child.href + '/')
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'block rounded-md px-3 py-1.5 text-sm transition-colors',
                              isChildActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                          >
                            {child.title}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                {!collapsed && <span className="ml-3">{item.title}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}

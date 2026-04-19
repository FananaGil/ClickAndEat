'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Utensils,
  ClipboardList,
  Settings,
  BarChart3,
  Users,
  Store,
  ShoppingBag,
} from 'lucide-react';

interface SidebarProps {
  type: 'tienda' | 'admin';
}

export function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname();

  const tiendaLinks = [
    {
      section: 'General',
      items: [
        { href: '/tienda-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/tienda-dashboard/menu', label: 'Menú', icon: Utensils },
        { href: '/tienda-dashboard/pedidos', label: 'Pedidos', icon: ClipboardList },
        { href: '/tienda-dashboard/configuracion', label: 'Configuración', icon: Settings },
      ],
    },
  ];

  const adminLinks = [
    {
      section: 'Gestión',
      items: [
        { href: '/admin', label: 'Dashboard', icon: BarChart3 },
        { href: '/admin/tiendas', label: 'Tiendas', icon: Store },
        { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
        { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
      ],
    },
  ];

  const links = type === 'tienda' ? tiendaLinks : adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0 hidden lg:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-lg font-bold font-heading text-gray-900">
              Click&Eat
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {links.map((section) => (
            <div key={section.section}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                {section.section}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Versión</p>
            <p className="text-sm font-medium text-gray-900">1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

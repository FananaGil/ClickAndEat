'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';
import {
  Home,
  Search,
  ShoppingCart,
  User,
  Store,
  ClipboardList,
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const cartItems = useCart((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.cantidad, 0);

  const isStoreDashboard = pathname?.startsWith('/tienda-dashboard');
  const isAdmin = pathname?.startsWith('/admin');

  const clientLinks = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/buscar', label: 'Buscar', icon: Search },
    {
      href: '/carrito',
      label: 'Carrito',
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      href: isAuthenticated ? '/perfil' : '/login',
      label: 'Perfil',
      icon: User,
    },
  ];

  const dashboardLinks = [
    { href: '/tienda-dashboard', label: 'Dashboard', icon: Home },
    { href: '/tienda-dashboard/menu', label: 'Menú', icon: Store },
    { href: '/tienda-dashboard/pedidos', label: 'Pedidos', icon: ClipboardList },
    { href: '/perfil', label: 'Perfil', icon: User },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/tiendas', label: 'Tiendas', icon: Store },
    { href: '/admin/usuarios', label: 'Usuarios', icon: User },
  ];

  const links = isStoreDashboard
    ? dashboardLinks
    : isAdmin
    ? adminLinks
    : clientLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center px-4 py-2 rounded-lg min-w-[60px] transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {link.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{link.label}</span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

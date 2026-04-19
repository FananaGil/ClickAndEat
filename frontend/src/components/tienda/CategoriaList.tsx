'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { CategoriaMenu } from '@/types';
import { MenuItemCard, MenuItemCardSkeleton } from './MenuItem';
import type { MenuItem } from '@/types';

interface CategoriaListProps {
  categorias: CategoriaMenu[];
  onAddItem?: (item: MenuItem, quantity: number, comments: string) => void;
  onRemoveItem?: (item: MenuItem) => void;
  cartItems?: Map<string, number>;
  isLoading?: boolean;
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
}

export function CategoriaList({
  categorias,
  onAddItem,
  onRemoveItem,
  cartItems = new Map(),
  isLoading = false,
  activeCategory,
  onCategoryChange,
}: CategoriaListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categorias.map((c) => c.id))
  );
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-expand active category
  useEffect(() => {
    if (activeCategory && !expandedCategories.has(activeCategory)) {
      setExpandedCategories((prev) => new Set([...prev, activeCategory]));
    }
  }, [activeCategory, expandedCategories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current.get(categoryId);
    if (element) {
      const yOffset = -100; // Offset for header
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    onCategoryChange?.(categoryId);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="w-32 h-6 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              <MenuItemCardSkeleton />
              <MenuItemCardSkeleton />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!categorias || categorias.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
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
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No hay menú disponible
        </h3>
        <p className="text-gray-500">
          Esta tienda aún no ha agregado productos al menú.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sticky Category Navigation */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => scrollToCategory(categoria.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                activeCategory === categoria.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {categoria.icon && <span className="mr-1">{categoria.icon}</span>}
              {categoria.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Categories and Items */}
      {categorias.map((categoria) => {
        const isExpanded = expandedCategories.has(categoria.id);
        const hasItemsInCart = Array.from(cartItems.keys()).some(
          (itemId) =>
            categoria.items.some((item) => item.id === itemId)
        );

        return (
          <section
            key={categoria.id}
            ref={(el) => {
              if (el) categoryRefs.current.set(categoria.id, el);
            }}
            id={`category-${categoria.id}`}
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(categoria.id)}
              className={cn(
                'flex items-center justify-between w-full mb-4 group',
                hasItemsInCart && 'bg-primary/5 -mx-4 px-4 py-2 rounded-lg'
              )}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {categoria.icon && (
                    <span className="mr-2">{categoria.icon}</span>
                  )}
                  {categoria.nombre}
                </h2>
                {hasItemsInCart && (
                  <span className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                {isExpanded ? 'Ocultar' : 'Ver todo'}
              </span>
            </button>

            {/* Items */}
            {isExpanded && (
              <div className="space-y-3">
                {categoria.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAdd={onAddItem}
                    onRemove={onRemoveItem}
                    isInCart={cartItems.has(item.id)}
                    cartQuantity={cartItems.get(item.id) || 0}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { formatINR } from '../../lib/upiUtils';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Link
      to={`/products/${product.slug || product.id}`}
      className="group relative bg-white dark:bg-neutral-900/70 hover:bg-slate-50 dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-800/80 hover:border-cyan-500/50 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between"
    >
      {/* Product Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-neutral-950">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Minimal Category Tag */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
          <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-medium rounded-md bg-white/90 dark:bg-neutral-950/80 backdrop-blur-md text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-neutral-700/60 shadow-sm">
            {product.category}
          </span>
        </div>

        {/* Status tag only when Out of Stock */}
        {!product.is_available && (
          <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5">
            <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono rounded bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1 sm:space-y-1.5">
          <h3 className="font-display font-semibold text-xs sm:text-base text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>

          <p className="text-slate-600 dark:text-neutral-400 text-[11px] sm:text-xs line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-2.5 sm:pt-3 mt-2 sm:mt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between gap-1">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400 font-medium">Price</span>
            <span className="font-display font-bold text-sm sm:text-lg text-slate-900 dark:text-white">
              {formatINR(product.price)}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-neutral-800 group-hover:bg-cyan-600 group-hover:text-white dark:group-hover:bg-cyan-500 dark:group-hover:text-neutral-950 text-slate-700 dark:text-neutral-200 text-[10px] sm:text-xs font-semibold tracking-wide transition-all shrink-0">
            <span>View</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
};

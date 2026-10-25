import React from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ProductBreadcrumbProps {
  categoryName: string;
  productTitle: string;
}

export function ProductBreadcrumb({ categoryName, productTitle }: ProductBreadcrumbProps) {
  return (
    <div className="bg-[var(--background-card)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Breadcrumb>
          <BreadcrumbList className="text-xs text-[var(--foreground-subtle)]">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="hover:text-[var(--foreground)] transition-colors">
                  Início
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/produtos" className="hover:text-[var(--foreground)] transition-colors">
                  Vestidos
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to={`/produtos?categoria=${encodeURIComponent(categoryName)}`}
                  className="hover:text-[var(--foreground)] transition-colors capitalize"
                >
                  {categoryName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[var(--foreground-secondary)] truncate max-w-xs font-normal">
                {productTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}

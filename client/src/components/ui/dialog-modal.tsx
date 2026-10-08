"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function DialogModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  className,
  bodyClassName,
  footerClassName,
  onSubmit,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
  }[maxWidth];

  const content = (
    <>
      {/* Zona 2: Body (formulario) - Único elemento con scroll interno */}
      <div
        className={cn(
          "overflow-y-auto flex-1 min-h-0 p-4 sm:p-6 overscroll-contain",
          bodyClassName
        )}
      >
        {children}
      </div>

      {/* Zona 3: Footer - Siempre visible, fijo abajo, fondo sólido y borde superior */}
      {footer && (
        <div
          className={cn(
            "flex-shrink-0 bg-white border-t border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5",
            footerClassName
          )}
          style={{
            paddingBottom: "max(0.875rem, env(safe-area-inset-bottom, 0.875rem))",
          }}
        >
          {footer}
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Backdrop con desenfoque suave y scroll bloqueado en body */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Modal: Estructura flex en columna, max-height calc(100dvh - 2rem) */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-fade-in z-10 flex flex-col mx-auto",
          "max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)]",
          "w-[calc(100%-0.75rem)] sm:w-full",
          maxWidthClass,
          className
        )}
        style={{
          maxHeight: "calc(100dvh - 2rem)",
        }}
      >
        {/* Zona 1: Header - Fijo arriba */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-100 bg-white sm:bg-slate-50/60 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5 truncate sm:whitespace-normal">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zona 2 & 3: Formulario o contenedor flex según corresponda */}
        {onSubmit ? (
          <form
            onSubmit={onSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            {content}
          </form>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

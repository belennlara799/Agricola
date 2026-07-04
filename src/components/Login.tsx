/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sprout, Lock, Sparkles, ArrowRight, UserCheck } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate a brief elegant load
    setTimeout(() => {
      // Allow '1234' or 'maria123' as standard secure pins/passwords
      const cleanedPin = pin.trim().toLowerCase();
      if (cleanedPin === "1234" || cleanedPin === "maria123" || cleanedPin === "maria") {
        onLoginSuccess();
      } else {
        setError("PIN de acceso o contraseña incorrecta. Intente con '1234' o 'maria'.");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" id="login-container">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>
      
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative" id="login-card">
        {/* Top visual bar */}
        <div className="bg-emerald-800 px-6 py-8 text-center text-white relative">
          <div className="absolute inset-0 bg-radial-gradient from-emerald-700/50 to-emerald-900/90 opacity-40"></div>
          
          <div className="relative z-10 flex flex-col items-center space-y-3">
            <div className="bg-emerald-600/90 p-3 rounded-2xl border border-emerald-500 shadow-lg flex items-center justify-center">
              <Sprout className="h-8 w-8 text-emerald-100" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Registro Agrícola
              </h1>
              <p className="text-xs text-emerald-200 mt-1 font-medium uppercase tracking-wider">
                Sistema de Control y Liquidaciones
              </p>
            </div>
          </div>
        </div>

        {/* Welcome & Login Form body */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-55/80 text-emerald-700 rounded-full border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 animate-pulse text-emerald-600" />
              <span>Acceso Personalizado</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              ¡Bienvenida MARIA GALLEGUILLOS!
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Por favor, ingrese su PIN o contraseña para iniciar sesión de forma segura.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                PIN de Acceso o Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Ingrese PIN (ej. 1234)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-semibold text-slate-700 placeholder-slate-400"
                  id="login-pin-input"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-semibold text-center" id="login-error-message">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              id="login-submit-btn"
            >
              {isLoading ? (
                <span>Iniciando sesión...</span>
              ) : (
                <>
                  <UserCheck className="h-4.5 w-4.5" />
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick instructions block */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-400 font-medium text-center">
            🔒 Claves de demostración sugeridas: <strong className="text-slate-600">1234</strong> o <strong className="text-slate-600">maria</strong>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <p className="mt-8 text-center text-[11px] text-slate-400 font-medium">
        Control de Cosecha &copy; {new Date().getFullYear()} • Desarrollado con seguridad persistente
      </p>
    </div>
  );
}

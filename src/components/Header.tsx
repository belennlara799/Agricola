/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { 
  Sprout, 
  Download, 
  Upload, 
  Info, 
  RefreshCw, 
  FileText,
  Percent
} from "lucide-react";

interface HeaderProps {
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
}

export default function Header({ onExportBackup, onImportBackup, onResetData }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = React.useState(false);

  return (
    <header className="bg-emerald-800 text-white shadow-md border-b border-emerald-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-4 space-y-4 sm:space-y-0">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl border border-emerald-500 shadow-inner flex items-center justify-center animate-pulse">
              <Sprout className="h-6 w-6 text-emerald-100" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center">
                Registro Agrícola <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-emerald-700 text-emerald-200 rounded-full border border-emerald-600">v1.2</span>
              </h1>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                Control semanal de cosechas y pagos • Jueves a Miércoles
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-900 text-emerald-100 rounded-lg text-sm font-medium border border-emerald-600 transition-colors"
              title="Cómo funciona"
              id="btn-how-it-works"
            >
              <Info className="h-4 w-4" />
              <span className="hidden md:inline">¿Cómo funciona?</span>
            </button>

            <button
              onClick={onExportBackup}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-750 hover:bg-emerald-700 active:bg-emerald-900 text-emerald-100 rounded-lg text-sm font-medium border border-emerald-600/50 transition-colors"
              title="Exportar copia de seguridad en JSON"
              id="btn-export-backup"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-750 hover:bg-emerald-700 active:bg-emerald-900 text-emerald-100 rounded-lg text-sm font-medium border border-emerald-600/50 transition-colors"
              title="Importar copia de seguridad desde JSON"
              id="btn-import-backup"
            >
              <Upload className="h-4 w-4" />
              <span>Importar</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportBackup}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => {
                if (window.confirm("¿Estás seguro de que deseas restablecer todos tus datos registrados? Esta acción no se puede deshacer.")) {
                  onResetData();
                }
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-900/55 hover:bg-red-850 active:bg-red-950 text-red-200 hover:text-red-100 rounded-lg text-xs font-medium border border-red-800 transition-colors"
              title="Restablecer todos los datos"
              id="btn-reset-data"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        {/* Dynamic Help Card */}
        {showHelp && (
          <div className="mt-2 mb-4 p-4 bg-emerald-900/80 border border-emerald-700 text-emerald-100 rounded-xl text-sm leading-relaxed space-y-3 animate-fade-in shadow-lg">
            <h3 className="font-semibold text-white flex items-center text-base border-b border-emerald-800 pb-1.5">
              <Info className="h-4 w-4 mr-2 text-emerald-400" />
              Guía de Funcionamiento
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-emerald-200">
              <li>
                <strong className="text-white">Ciclo de Miércoles a Miércoles:</strong> El ciclo de pago cierra cada miércoles. Esto significa que los días de trabajo de una semana de pago comienzan el <strong className="text-emerald-300">Jueves</strong> y terminan el <strong className="text-emerald-300">Miércoles</strong> siguiente. Al registrar un producto para cualquier día, la aplicación lo agrupará automáticamente en el período correspondiente.
              </li>
              <li>
                <strong className="text-white">Descuento de Impuesto (19%):</strong> De acuerdo con tus especificaciones, se realiza un descuento fijo automático del <strong className="text-rose-300 font-bold">19%</strong> sobre los ingresos brutos semanales calculados para obtener el pago líquido real neto.
              </li>
              <li>
                <strong className="text-white">Registro Diario de Cosecha:</strong> En la sección de registro, selecciona el día de la semana y el producto que cosechaste o trabajaste, digita las cantidades y la aplicación se encargará de realizar las multiplicaciones y sumas instantáneamente.
              </li>
              <li>
                <strong className="text-white">Historial y Filtros:</strong> En el apartado de comparativas puedes analizar tu rendimiento frente a semanas anteriores filtrando específicamente por año, mes o seleccionando la semana de corte de interés.
              </li>
              <li>
                <strong className="text-white">Copia de Seguridad:</strong> Tu información se guarda localmente de forma segura en tu navegador. Puedes usar los botones de <strong className="text-white">Exportar</strong> e <strong className="text-white">Importar</strong> para descargar un archivo con tus datos y evitar cualquier riesgo de pérdida.
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}

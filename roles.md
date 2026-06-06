# Manual de Roles y Permisos — HotelFlow

Este documento detalla las responsabilidades, permisos y acceso a las pantallas del sistema para cada uno de los tres roles definidos en **HotelFlow**: **Administrador**, **Recepcionista** y **Contador**.

---

## 1. Rol: Administrador (`ADMIN`)

El Administrador tiene el control total de la plataforma y supervisa tanto las operaciones diarias como las finanzas globales del hotel.

### Permisos Generales
- **Acceso Total:** Tiene acceso a todas las pantallas, formularios, reportes y configuraciones del sistema sin restricciones.
- **Gestión de Base de Datos:** Permiso completo de lectura, creación, modificación y eliminación (CRUD) de todas las entidades.

### Funciones Específicas
- **Dashboard:** Visualización completa de métricas de ocupación, ingresos de hoy, proyección mensual, gráfico de facturación semanal y registro de actividades de todo el personal.
- **Gestión de Habitaciones:** Único rol con capacidad de crear nuevas habitaciones, editar tarifas por noche, cambiar tipos de habitación y eliminar unidades del sistema.
- **Gestión de Clientes:** Búsqueda, creación, modificación y eliminación de registros de huéspedes.
- **Reservas:** Crear reservas, registrar pagos, realizar check-in, check-out y cancelación de reservas.
- **Finanzas:** Registro de transacciones y visualización de la lista histórica de pagos.
- **Reportes:** Acceso completo a los tres módulos de reportes: Financiero, Ocupación de Habitaciones y Clientes Frecuentes (VIP).

---

## 2. Rol: Recepcionista (`RECEPCIONISTA`)

El Recepcionista es responsable de la atención al huésped, gestión de las reservas diarias, y flujo de entrada (check-in) y salida (check-out) en las habitaciones.

### Permisos Generales
- **Acceso Operativo:** Enfocado en la gestión directa de los huéspedes y su estadía.
- **Restricción Financiera:** No puede acceder al registro histórico de pagos ni ver reportes financieros detallados.
- **Restricción de Inventario:** Puede visualizar habitaciones y su estado, pero no modificarlas ni agregar nuevas habitaciones.

### Funciones Específicas
- **Dashboard:** Visualización del ratio de ocupación actual, conteo de reservas activas, lista de check-ins/check-outs pendientes hoy y actividad reciente limitada.
- **Habitaciones:** Vista del panel de habitaciones para verificar disponibilidad. Puede cambiar el estado de una habitación de forma rápida a "Mantenimiento" o "Disponible" (pero no puede alterar precios ni números de habitación).
- **Clientes:** Acceso total para crear, buscar y actualizar información de huéspedes en el directorio.
- **Reservas:** Gestión del flujo completo de reservas:
  - Crear nuevas reservas y verificar disponibilidad de habitaciones en tiempo real.
  - Procesar el **Check-in** al ingreso del huésped.
  - Procesar el **Check-out** al egreso del huésped. Si hay saldo pendiente, el sistema le permite cobrar la deuda pendiente para proceder con la salida.
  - Cancelación de reservas activas.
- **Reportes:** Únicamente tiene acceso al reporte operativo de **Utilización de Habitaciones** (para ver estadísticas de noches reservadas por cada habitación). Los reportes financieros y VIP están ocultos para este rol.

---

## 3. Rol: Contador (`CONTADOR`)

El Contador se enfoca exclusivamente en la salud financiera del hotel, auditoría de transacciones, recaudaciones y generación de reportes tributarios/operativos.

### Permisos Generales
- **Acceso Financiero:** Acceso total al historial de cobros, transacciones y balances.
- **Acceso Lectura Operativa:** Puede visualizar el estado de habitaciones y reservas, pero no puede operar flujos de huéspedes (como realizar check-ins o check-outs) ni modificar información de clientes.

### Funciones Específicas
- **Dashboard:** Visualización completa del rendimiento financiero diario y mensual, así como los gráficos de ingresos semanales.
- **Pagos:** Acceso completo al panel de transacciones financieras. Puede listar todos los abonos y métodos de pago (Efectivo, Tarjeta, Transferencia), y emitir/imprimir los comprobantes de pago (PDF de boletas de venta).
- **Reportes:** Acceso total a los reportes analíticos:
  - **Reporte Financiero:** Desglose mensual de ingresos y gráficos de facturación.
  - **Reporte de Utilización de Habitaciones:** Total de ingresos generados por cada habitación y noches reservadas.
  - **Clientes VIP:** Listado de huéspedes que más ingresos han aportado al hotel.
- **Habitaciones y Reservas:** Visualización en modo lectura. No tiene botones de creación ni modificación en estas pantallas.
- **Clientes:** El acceso directo al directorio de clientes está restringido para este rol para resguardar la privacidad de datos personales.

---

## Resumen de Accesos a Pantallas (Matriz de Control)

| Pantalla / Funcionalidad | Administrador (`ADMIN`) | Recepcionista (`RECEPCIONISTA`) | Contador (`CONTADOR`) |
| :--- | :---: | :---: | :---: |
| **Dashboard (KPIs Financieros)** | Sí | Ocupación / Operativo | Sí |
| **Habitaciones (Ver)** | Sí | Sí | Sí |
| **Habitaciones (Crear/Editar/Borrar)** | **Sí** | No | No |
| **Clientes (Ver / Crear / Editar)** | **Sí** | **Sí** | No |
| **Reservaciones (Ver)** | Sí | Sí | Sí |
| **Reservaciones (Crear / Operar)** | **Sí** | **Sí** | No |
| **Reservaciones (Check-in/Check-out)** | **Sí** | **Sí** | No |
| **Pagos (Ver Historial / Comprobantes)** | **Sí** | No | **Sí** |
| **Pagos (Registrar)** | **Sí** | Sí (Solo en Check-out) | No |
| **Reportes (Financiero / VIP)** | **Sí** | No | **Sí** |
| **Reportes (Ocupación de Habitaciones)** | Sí | Sí | Sí |

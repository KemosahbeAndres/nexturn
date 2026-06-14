# Contexto General del Proyecto
Esta es una Plataforma SaaS (Software as a Service) multi-empresa (multi-tenant) para la gestión general de calendarios, turnos y personal. El sistema permite a diferentes empresas u organizaciones (clientes) administrar sus propias ubicaciones, roles y horarios de manera aislada y segura.

El proyecto nació como una solución para una congregación (Lauca), pero escaló a una arquitectura B2B generalizada.

# Stack Tecnológico
* **Framework Core:** Vue 3 (Single Page Application - SPA)
* **Build Tool:** Vite
* **Lenguaje:** TypeScript (Tipado estricto)
* **Estilos y Maquetación:** Tailwind CSS (Uso exclusivo de clases utilitarias, sin frameworks de UI restrictivos)
* **Enrutamiento:** Vue Router
* **Manejo de Estado Global:** Pinia
* **Backend / Base de Datos:** Firebase (Firestore y Authentication)
* **Integración Firebase/Vue:** VueFire

# Reglas de Arquitectura y Desarrollo frontend
1.  **Cero Componentes Móviles Nativos:** El proyecto es una SPA web. **NO** utilices etiquetas de Ionic (como `<ion-page>`, `<ion-content>`, `<ion-button>`). Utiliza HTML5 semántico (`<main>`, `<section>`, `<div>`, `<button>`).
2.  **Estilos con Tailwind:** Todos los estilos visuales deben aplicarse mediante clases de Tailwind CSS. No se deben crear archivos `.css` o `<style scoped>` separados a menos que sea estrictamente para animaciones complejas o directivas específicas que Tailwind no cubra.
3.  **Composition API:** Todo componente de Vue debe utilizar la sintaxis `<script setup lang="ts">`.
4.  **Orientación a Objetos en Modelos:** Los datos traídos de Firestore deben mapearse a clases de TypeScript (ej. `new Personal(data)`) para garantizar consistencia y encapsulamiento de métodos antes de llegar a la vista.

# Entorno del Desarrollador
* Sistema Operativo: Fedora 44.
* IDE: Visual Studio Code instalado mediante Flatpak.
* *Nota para la IA sobre comandos de terminal:* Si me vas a sugerir comandos que deban interactuar con Node, npm o git desde la terminal integrada de VS Code, recuerda anteponer `flatpak-spawn --host` para salir del sandbox (ej. `flatpak-spawn --host npm install`).

# Instrucciones para la IA (Cómo debes responderme)
* Proporciona código directamente en Vue 3 con `<script setup lang="ts">`.
* Asume siempre que Tailwind CSS está completamente configurado.
* Cuando me des ejemplos de Pinia, usa la sintaxis Setup Store (con ref y computed) en lugar de Options Store.
* Estructura la información para escaneabilidad rápida: usa encabezados, listas y bloques de código claros.
* Mantén presente la regla de oro: El `empresa_id` es el filtro absoluto para cualquier consulta (query) a Firestore. Ningún usuario debe ver datos que no pertenezcan al `empresa_id` de su sesión activa.

# Modelo de Datos Base (Colecciones en Firestore)
La base de datos sigue una estructura jerárquica para aislar los datos de cada cliente:

* **`empresas`**: El inquilino/cliente principal (Tenant).
    * Campos clave: `id`, `nombre`, `fecha_registro`, `estado`.
* **`ubicaciones`**: Espacios físicos o áreas lógicas vinculadas a una empresa.
    * Campos clave: `id`, `empresa_id`, `nombre`, `direccion`.
* **`personal`**: Trabajadores o miembros pertenecientes a una empresa.
    * Campos clave: `id`, `empresa_id`, `nombre`, `email`, `rol_sistema` (super_admin, admin_empresa, usuario), `roles_trabajo` (array con cargos específicos de la empresa).
* **`asignaciones`**: El registro de turnos o eventos en el calendario.
    * Campos clave: `id`, `empresa_id`, `ubicacion_id`, `personal_id` (o array si hay más de uno), `fecha_inicio` (Timestamp), `fecha_fin` (Timestamp), `estado` (confirmado, pendiente, cancelado).

### Colección "contactos"
Esta colección manejara los datos de contacto de los usuarios, empresas y personal. Eso significa que un usuario puede compartir el contacto con un empleado. Pero una empresa no compartira contacto con nadie mas porque es una empresa.
#### Campos
- id: string uuid.
- first_name: string.
- last_name: string.
- rut: string.
- email: string.
- phone: string.
- address: string
- is_company: boolean (solo en caso que sea una empresa).
- active: boolean.
- timestamps y softdeletes

### Colección "empresas"
El nivel más alto de la jerarquía. Define a los "inquilinos" o clientes de tu sistema (ej. Congregación Lauca, Burger King Chile).
- id: string uuid.
- active: boolean.
- contact_id: string (referencia al contacto relacionado).
- type: string (empresa o congregacion).
- work_roles: array de strings (cocinero, publicador, cajero, supervisor, asistente, gerente, encargado, etc) (personalizable solo por el usuario system_role = admin o super_admin).
- timestamps y softdeletes

### Colección "usuarios"
Esta colección maneja exclusivamente a las personas que inician sesión en la plataforma de gestión.
#### Campos
- id: string uuid.
- empresa_id: string | null (Referencia a la empresa dueña, sera null en caso del super administrador).
- contact_id: string (referencia al contacto relacionado).
- password: string (obligatorio).
- system_role: string. Define los permisos de visualización y edición.
  1. super_admin: Mira todas las empresas.
  2. admin: Solo ve suempresa, gestiona usuarios, roles, personal y turnos (todo dentro de la empresa).
  3. user: Solo gestiona personal, horarios/turnos y excepciones de su empresa.
  4. visitor: Solo lectura de personal y calendarios de su empresa.
- timestamps y softdeletes. 

### Colección "sesiones"
Esta colección se encargara de manejar las sesiones de los diferentes usuarios del sistema para mantener la seguridad.
#### Campos
- id: string uuid de firebase.
- user_id: string (Referencia al usuario relacionado).
- browser_agent: string (Agente del navegador, para tener seguridad sobre la ubicacion del usuario).
- token: string (token de session que se le entrega a cada cliente por separado).
- duration: number (duracion en minutos del token, 0 significa duracion infinita).
- timestamps.

### Colección "ubicaciones"
Define los puntos de reunión fijos físicos (como el carrito) y los horarios establecidos.
#### Campos
- id: uuid string.
- company_id: string (Referencia a la empresa dueña).
- zone_id: string|null (para relacionar sucursales con una zona. En congregaciones sera null).
- category: string (sucursal, territorio, stand, etc).
- manager_id: string|null (establece al encargado de sucursal o al capitan de grupo).
- name: string (ej: "Bertin Soto", "Agro Santa María").
- address: string.
- active: boolean.
- turnos: array de objetos tipo "turno".
- timestamps y softdeletes

### Colección "zonas"
Esta colección resuelve el problema de los gerentes que supervisan múltiples sucursales. Las congregaciones simplemente no utilizarán esta colección.
#### Campos
- id: uuid string.
- empresa_id: string (dueño)
- name: string
- manager_id: string|null (referencia al id en coleccion 'personal', actua como gerente de zona).
- active: boolean.
- required_role: lista de roles aceptados para ser asignados (esto considera que los roles de trabajo son personalizados).
- timestamps y softdeletes

### Objeto "turno"
Define el día y horario disponible para asignar personas y la cantidad de personas que se necesitan.
#### Campos
- id: uuid string
- day_of_week: string (ej: "Lunes", "Sábado").
- start_time: string (ej: "09:00").
- end_time: string (ej: "12:00" o "15:00").
- slots_available: number (por defecto 2 personas por turno).
- required_roles: array de strings (cajero, supervisor, publicador, etc).
- timestamps y softdeletes

### Colección "empleado" 
Almacena la información personal de los empleados y sus reglas base de disponibilidad.
#### Campos
- id: string (UUID).
- company_id: string (Referencia a la colección empresas).
- contact_id: string (referencia al contacto relacionado).
- active: boolean.
- work_role: string (publicador, cajero, supervisor, asistente, gerente, encargado, etc).
- disponibilidad: objeto tipo "disponibilidad".
- timestamps y softdeletes

### Objeto "disponibilidad"
Objeto que define su rutina base de trabajo y sus frecuencias.
#### Campos
- id: uuid string.
- days: array de strings (ej: ['Lunes', 'Miercoles', 'Viernes']).
- monthly_frequency: number (ej: 1, 2, 3 o 0 para "todas las semanas del mes").
- weekly_frecuency: number (ej: 1, 2, 3, 4, 5, 6, 7 (todos los días de la semana)).
- special_rule: string (ej: "3 lunes y 1 miercoles", "2 lunes al mes").
- timestamps y softdeletes

### Colección "excepciones"
Esta colección sobrescribe la regla general de disponibilidad para casos como vacaciones, enfermedad o un día libre extra.
#### Campos
- id: uuid string.
- active: boolean.
- employee_id: string (Referencia al ID en la colección personal).
- date: string (Formato ISO YYYY-MM-DD).
- time_start: string (Formato HH:MM).
- time_end: string (Formato HH:MM).
- reason: string (Motivo de la excepción)
- type: string (feriado legal, día administrativo, emergencia, otro)
- timestamps y softdeletes


### Colección "reglas_asignacion"
Define qué personas deben o prefieren salir juntas, lo cual es especialmente útil para los turnos de fin de semana.
#### Campos
- id: uuid string.
- person_uno_id: string (Referencia al ID en la colección voluntarios).
- person_dos_id: string (Referencia al ID en la colección voluntarios).
- is_strict: boolean (Si es true, el algoritmo DEBE asignarlos juntos obligatoriamente, como en el caso de los matrimonios).
- type: string (juntos, nunca_juntos)
- timestamps y softdeletes

### 4. Colección "asignaciones"
Aquí es donde se guarda el resultado del calendario generado por tu algoritmo, almacenando tanto los borradores como las versiones publicadas.
#### Campos
- id: string.
- location_id: string (referencia a la ubicación asignada).
- date: string (Formato ISO YYYY-MM-DD). Indica la fecha de asignación.
- turn: Objeto tipo "turno".
- assigned_staff: array de strings (Contiene los IDs de los voluntarios asignados a ese turno exacto).
- status: string ('draft' | 'published').
- timestamps y softdeletes

## Explicaciones del modelo de datos

### Roles de Sistema vs Roles de Trabajo
Recuerda mantener intacta la separación de permisos que diseñamos:
- Gestión en la App (system_role en colección usuarios): Si el "Gerente de Zona" o el "Encargado de Sucursal" necesitan entrar a la plataforma web para armar los calendarios, se les crea un usuario con el rol de admin o asistente.
- Asignación de Turnos (work_role en colección personal): El "Capitán de grupo" no necesita armar el calendario general, solo necesita ver a dónde le toca ir. A él se le asigna el rol de visitante en el sistema, pero su work_role dice "Capitán" para que el algoritmo lo posicione como líder de grupo.
- A las zonas y sucursales podran asignarsele un encargado, la asignacion se basara en el rol de trabajo, o sea, se debe seleccionar el rol de encargado, dentro de la lista de roles de la empresa, al momento de crear la zona o sucursal.

### Colección asignaciones y el Objeto turno (El manejo de Liderazgo)
Para el caso de la congregación y los 'Capitanes de Grupo' (rol personalizado), la solución más limpia no es alterar la ubicación, sino el Turno.
Como ya definiste que cada turno tiene required_roles, resolver a los capitanes es automático: 
- Si la ubicación es un 'stand', su turno pedirá: required_roles: ['publicador', 'publicador']. 
- Si la ubicación es un 'territorio', su turno pedirá: required_roles: ['capitan_grupo'].
El algoritmo de asignación simplemente buscará en la colección personal a un hermano que tenga el work_role de "capitán_grupo" y lo colocará a cargo de esa asignación de territorio específica.
Algo similar ocurrira con las zonas y sucursales, habra un campo admin_role que se definira como encargado y tambien habra una relacion con el encargado manager_id de la sucursal o zona que estara limitado a 1 solo. 

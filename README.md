# Generador de Presupuestos Admira

Herramienta web para crear propuestas comerciales de forma visual, rápida y personalizable.

La plataforma permite construir una propuesta en varias páginas, adaptar textos, cargar identidad de marca, importar un Excel real de presupuesto y generar un PDF listo para compartir con cliente.

## Enlace público

Usar aquí: [admira-presupuestos.admira-1619.chatgpt.site](https://admira-presupuestos.admira-1619.chatgpt.site/)

## Qué hace

- Crea una propuesta comercial en 3 bloques:
  - portada
  - desarrollo de la propuesta
  - inversión
- Usa el logo de Admira por defecto, con opción de cambiarlo
- Permite definir colores de marca y usarlos solo en títulos y destacados
- Deja redactar la experiencia con lenguaje natural y convertirla en una versión más clara y comercial
- Importa un Excel de presupuesto para detectar partidas generales
- Calcula importes automáticamente
- Detecta contingencia e IVA cuando vienen indicados en el presupuesto
- Permite mostrar u ocultar la contingencia manteniendo el total correcto
- Permite aplicar descuentos:
  - al total final
  - o por partida
- Permite redondear el importe final al alza
- Genera un PDF adaptado a impresión

## Flujo de uso

1. Completar la información general del proyecto
2. Añadir logo, marca y textos de la propuesta
3. Importar el Excel del presupuesto
4. Revisar las partidas generales detectadas
5. Ajustar IVA, contingencia, descuentos y redondeo si hace falta
6. Descargar la propuesta en PDF

## Partidas del presupuesto

La herramienta está pensada para enseñar al cliente un presupuesto resumido por grandes secciones, no todo el desglose interno.

Ejemplos de bloques que puede detectar:

- transporte
- personal técnico
- requisitos técnicos
- seguro
- animaciones
- alquiler de robots
- contingencia

Cada bloque puede mostrar una breve explicación de qué incluye, sin entrar en detalle excesivo.

## Tecnología

- Next.js
- React
- TypeScript
- Vinext / Cloudflare runtime

## Desarrollo local

Requisitos:

- Node.js 22 o superior

Instalación:

```bash
npm install
```

Entorno local:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Tests:

```bash
npm test
```

## Estructura principal

- `app/page.tsx`: interfaz principal del generador
- `app/globals.css`: estilos globales
- `public/admira-logo.png`: logo por defecto de Admira
- `docs/`: versión estática para publicación simple

## Repositorios

- GitHub: [agonzalez-ux/Generador-Presupuestos](https://github.com/agonzalez-ux/Generador-Presupuestos)
- Bitbucket: [admira/generador-presupuestos-admira](https://bitbucket.org/admira/generador-presupuestos-admira/src/main/)

## Estado

Proyecto activo y publicado.

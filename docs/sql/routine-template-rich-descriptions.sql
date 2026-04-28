-- Add short + long routine descriptions for UI cards and routine detail guide.

alter table public.routine_templates
  add column if not exists short_description text null,
  add column if not exists long_description_md text null;

update public.routine_templates
set
  short_description = 'Rutina basica de 3 dias para construir fuerza, volumen e intensidad mixta.',
  long_description_md = $$## Enfoque de la rutina
- 3 dias full body con progresion simple.
- Ideal para construir base tecnica y fuerza general.
- Sesiones de 50-70 min.

## Como trabajarla bien
1. Mantenete en RIR 1-2 en los ejercicios principales.
2. Cuando llegues al tope del rango de reps en todas las series, subi un poco la carga.
3. Prioriza tecnica limpia antes que peso.

## Descansos recomendados
- Basicos pesados: 2-3 min.
- Ejercicios accesorios: 60-90 seg.
- Core: 30-60 seg.

## Tip rapido
- Si un dia llegas fatigado, baja 1 serie y manten la intensidad.
- La constancia semanal vale mas que una sola sesion perfecta.$$
where id = 1;

update public.routine_templates
set
  short_description = 'Split de 4 dias por grupos musculares para hipertrofia con progresion semanal.',
  long_description_md = $$## Enfoque de la rutina
- Dia 1: Pecho + Biceps.
- Dia 2: Espalda + Triceps.
- Dia 3: Hombros + Abs.
- Dia 4: Piernas completas.

## Como sacarle resultado
1. Entrena cerca del fallo en las ultimas series (RIR 1-2).
2. Si completas el maximo de reps del rango, subi carga.
3. Manten control del tempo en accesorios.

## Descansos recomendados
- Compuestos: 2-3 min.
- Accesorios: 60-90 seg.
- Superseries: 30-45 seg entre ejercicios.

## Claves practicas
- No entrenes liviano por costumbre.
- Primero tecnica, despues progresion, despues volumen.
- Este split funciona muy bien si sostenes intensidad real.$$
where id = 2;

update public.routine_templates
set
  short_description = 'Plan de 3 dias con foco en gluteos y piernas, mas tonificacion de upper y core.',
  long_description_md = $$## Enfoque de la rutina
- Frecuencia 2x de tren inferior para acelerar resultados en gluteos.
- Upper + core para postura, tono y equilibrio general.
- Duracion estimada: 60 min.

## Como trabajarla bien
1. Ultima serie cerca del fallo (RIR 1-2).
2. En gluteos podes acercarte un poco mas al fallo.
3. No recortes descansos en los ejercicios principales.

## Descansos recomendados
- Basicos de piernas/gluteos: 90-120 seg.
- Upper accesorios: 60-90 seg.
- Core: 30-60 seg.

## Claves de coach
- Apreta gluteos fuerte al final de cada repeticion.
- Prioriza rango de movimiento completo.
- Si una semana estas cargada, baja una serie pero conserva calidad.$$
where id = 3;

update public.routine_templates
set
  short_description = 'Rutina en casa (40-60 min) para gluteos, piernas y tonificacion total sin gimnasio.',
  long_description_md = $$## Enfoque de la rutina
- 3 dias: gluteos/piernas + upper/core.
- Pensada para casa con banda, mochila o peso corporal.
- Objetivo: tono + progreso sin necesidad de maquinas.

## Como progresar en casa
1. Sube reps dentro del rango semana a semana.
2. Agrega pausa arriba (sobre todo en gluteos).
3. Cuando domines el rango, agrega mochila/banda o tempo mas lento.

## Descansos recomendados
- Superseries: 30-45 seg.
- Ejercicios principales: 60-90 seg.
- Circuito core: 20-30 seg.

## Tips para que funcione de verdad
- Menos peso no significa menos resultado.
- Controla la bajada, no rebotes.
- En thrust y puentes, contrae gluteos arriba en cada rep.$$
where id = 4;

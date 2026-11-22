-- Bloqueia a duplicação do mesmo registro de dose em dois dispositivos.
-- Índice parcial: registros manuais sem horário continuam permitidos.
create unique index if not exists medicamento_doses_unique_scheduled_occurrence
on public.medicamento_doses (user_id, medicamento_id, horario_id, prevista_para)
where horario_id is not null;

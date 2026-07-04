-- ============================================================
-- SCBox — Bucket de Storage para comprobantes de movimientos
-- Privado. Ruta de cada archivo: {caja_id}/{archivo}
-- El acceso se resuelve igual que a la caja (public.puede_acceder_caja).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "ver comprobantes de cajas con acceso"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'comprobantes'
    and public.puede_acceder_caja((storage.foldername(name))[1]::uuid)
  );

create policy "subir comprobantes de cajas con acceso"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'comprobantes'
    and public.puede_acceder_caja((storage.foldername(name))[1]::uuid)
  );

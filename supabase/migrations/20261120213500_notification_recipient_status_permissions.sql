-- Allow recipients to manage only reading and archiving state.
-- RLS still limits updates to auth.uid() = user_id; no message content is writable.
grant update (read, read_at, archived_at) on public.notifications to authenticated;

-- Baseline RLS policies for the public schema.
--
-- Two layers per user-data table:
--   1. "own rows" / per-CRUD policies (PERMISSIVE) — ownership gate: user can only see their own rows.
--   2. pro_sync_paid (RESTRICTIVE) — plan gate: user must be on a paid plan to do anything.
--
-- Both must pass. RESTRICTIVE policies AND-combine with PERMISSIVE policies, so the user
-- needs (own row) AND (paid plan) for any operation.
--
-- Tables NOT gated by the paid plan:
--   - user_keys: free users still need a key row to use the app locally and upgrade later.
--   - profiles: needed to evaluate the plan check itself.
--
-- Each policy is preceded by `drop policy if exists` so this migration is safe to apply
-- against an environment that already has these policies (e.g. the production DB this
-- baseline was captured from) as well as a fresh DB. Drop is metadata-only — no row data
-- is touched. The whole migration runs in a transaction, so drop+create is atomic.

-- --- Enable RLS ---

alter table public.reminders        enable row level security;
alter table public.profiles         enable row level security;
alter table public.todos            enable row level security;
alter table public.notes            enable row level security;
alter table public.note_folders     enable row level security;
alter table public.user_keys        enable row level security;
alter table public.todo_list_items  enable row level security;
alter table public.todo_folders     enable row level security;
alter table public.todo_lists       enable row level security;

-- --- Ownership policies (PERMISSIVE) ---

drop policy if exists "own rows" on public.reminders;
create policy "own rows" on public.reminders
  as permissive for all to public
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own rows" on public.todos;
create policy "own rows" on public.todos
  as permissive for all to public
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can manage their own list items" on public.todo_list_items;
create policy "Users can manage their own list items" on public.todo_list_items
  as permissive for all to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own key" on public.user_keys;
create policy "Users can manage own key" on public.user_keys
  as permissive for all to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- todo_folders / todo_lists / note_folders / notes use text-typed user_id.
-- Split into per-CRUD policies to match the live schema; the cast guards
-- against subtle planner differences when comparing uuid to text.

drop policy if exists "Users can read own folders"   on public.todo_folders;
drop policy if exists "Users can insert own folders" on public.todo_folders;
drop policy if exists "Users can update own folders" on public.todo_folders;
drop policy if exists "Users can delete own folders" on public.todo_folders;
create policy "Users can read own folders"   on public.todo_folders for select to public using ((auth.uid())::text = user_id);
create policy "Users can insert own folders" on public.todo_folders for insert to public with check ((auth.uid())::text = user_id);
create policy "Users can update own folders" on public.todo_folders for update to public using ((auth.uid())::text = user_id);
create policy "Users can delete own folders" on public.todo_folders for delete to public using ((auth.uid())::text = user_id);

drop policy if exists "Users can read own lists"     on public.todo_lists;
drop policy if exists "Users can insert own lists"   on public.todo_lists;
drop policy if exists "Users can update own lists"   on public.todo_lists;
drop policy if exists "Users can delete own lists"   on public.todo_lists;
create policy "Users can read own lists"     on public.todo_lists for select to public using ((auth.uid())::text = user_id);
create policy "Users can insert own lists"   on public.todo_lists for insert to public with check ((auth.uid())::text = user_id);
create policy "Users can update own lists"   on public.todo_lists for update to public using ((auth.uid())::text = user_id);
create policy "Users can delete own lists"   on public.todo_lists for delete to public using ((auth.uid())::text = user_id);

drop policy if exists "Users can view their own note folders"   on public.note_folders;
drop policy if exists "Users can insert their own note folders" on public.note_folders;
drop policy if exists "Users can update their own note folders" on public.note_folders;
drop policy if exists "Users can delete their own note folders" on public.note_folders;
create policy "Users can view their own note folders"   on public.note_folders for select to public using ((auth.uid())::text = user_id);
create policy "Users can insert their own note folders" on public.note_folders for insert to public with check ((auth.uid())::text = user_id);
create policy "Users can update their own note folders" on public.note_folders for update to public using ((auth.uid())::text = user_id);
create policy "Users can delete their own note folders" on public.note_folders for delete to public using ((auth.uid())::text = user_id);

drop policy if exists "Users can view their own notes"   on public.notes;
drop policy if exists "Users can insert their own notes" on public.notes;
drop policy if exists "Users can update their own notes" on public.notes;
drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can view their own notes"   on public.notes for select to public using ((auth.uid())::text = user_id);
create policy "Users can insert their own notes" on public.notes for insert to public with check ((auth.uid())::text = user_id);
create policy "Users can update their own notes" on public.notes for update to public using ((auth.uid())::text = user_id);
create policy "Users can delete their own notes" on public.notes for delete to public using ((auth.uid())::text = user_id);

-- --- Paid-plan gate (RESTRICTIVE — AND-combined with the policies above) ---
-- Only profiles.plan in ('pro', 'comp') may read or write any of these tables.
-- Downgraded users lose all DB access; data remains in Supabase but is unreadable
-- to them until upgrade or a service-role-driven export.

drop policy if exists pro_sync_paid on public.reminders;
create policy pro_sync_paid on public.reminders
  as restrictive for all to public
  using (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])))
  with check (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])));

drop policy if exists pro_sync_paid on public.todos;
create policy pro_sync_paid on public.todos
  as restrictive for all to public
  using (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])))
  with check (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])));

drop policy if exists pro_sync_paid on public.notes;
create policy pro_sync_paid on public.notes
  as restrictive for all to public
  using (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])))
  with check (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])));

drop policy if exists pro_sync_paid on public.note_folders;
create policy pro_sync_paid on public.note_folders
  as restrictive for all to public
  using (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])))
  with check (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])));

drop policy if exists pro_sync_paid on public.todo_lists;
create policy pro_sync_paid on public.todo_lists
  as restrictive for all to public
  using (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])))
  with check (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])));

drop policy if exists pro_sync_paid on public.todo_list_items;
create policy pro_sync_paid on public.todo_list_items
  as restrictive for all to public
  using (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])))
  with check (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])));

drop policy if exists pro_sync_paid on public.todo_folders;
create policy pro_sync_paid on public.todo_folders
  as restrictive for all to public
  using (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])))
  with check (exists (select 1 from profiles
    where profiles.user_id = auth.uid()
      and profiles.plan = any (array['pro'::text, 'comp'::text])));

-- --- profiles ---
-- No INSERT policy: new profiles must be created via service_role (e.g. a Postgres
-- trigger on auth.users insert, or a backend handler). Verify onboarding actually
-- creates one — without that, signup would silently fail on first sync attempt.

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  as permissive for select to public
  using (auth.uid() = user_id);

drop policy if exists profiles_update_service on public.profiles;
create policy profiles_update_service on public.profiles
  as permissive for update to public
  using (auth.role() = 'service_role'::text);

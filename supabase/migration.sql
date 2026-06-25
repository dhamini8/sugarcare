-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create sugar_readings table
create table public.sugar_readings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sugar_value integer not null check (sugar_value >= 20 and sugar_value <= 600),
  reading_type text not null check (reading_type in ('Fasting', 'Before Meal', 'After Meal', 'Random')),
  notes text,
  reading_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create bp_readings table
create table public.bp_readings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  systolic integer not null check (systolic >= 50 and systolic <= 250),
  diastolic integer not null check (diastolic >= 30 and diastolic <= 150),
  pulse integer not null check (pulse >= 0),
  notes text,
  reading_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.sugar_readings enable row level security;
alter table public.bp_readings enable row level security;

-- Create policies for profiles
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create policies for sugar_readings
create policy "Users can view their own sugar readings" on public.sugar_readings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own sugar readings" on public.sugar_readings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own sugar readings" on public.sugar_readings
  for update using (auth.uid() = user_id);

create policy "Users can delete their own sugar readings" on public.sugar_readings
  for delete using (auth.uid() = user_id);

-- Create policies for bp_readings
create policy "Users can view their own bp readings" on public.bp_readings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bp readings" on public.bp_readings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own bp readings" on public.bp_readings
  for update using (auth.uid() = user_id);

create policy "Users can delete their own bp readings" on public.bp_readings
  for delete using (auth.uid() = user_id);

-- Automatic Profile Creation Trigger on Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create weight_readings table
create table public.weight_readings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  weight_value numeric not null check (weight_value >= 10.0 and weight_value <= 500.0),
  notes text,
  reading_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.weight_readings enable row level security;

-- Create policies for weight_readings
create policy "Users can view their own weight readings" on public.weight_readings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own weight readings" on public.weight_readings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own weight readings" on public.weight_readings
  for update using (auth.uid() = user_id);

create policy "Users can delete their own weight readings" on public.weight_readings
  for delete using (auth.uid() = user_id);

-- Alter profiles table to support age and condition indicators
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists has_diabetes boolean default false;
alter table public.profiles add column if not exists has_high_bp boolean default false;
alter table public.profiles add column if not exists has_low_bp boolean default false;

-- Recreate trigger function to insert age and condition indicators from auth metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, age, has_diabetes, has_high_bp, has_low_bp)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    (new.raw_user_meta_data->>'age')::integer,
    coalesce((new.raw_user_meta_data->>'has_diabetes')::boolean, false),
    coalesce((new.raw_user_meta_data->>'has_high_bp')::boolean, false),
    coalesce((new.raw_user_meta_data->>'has_low_bp')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create secure account deletion trigger RPC
create or replace function public.delete_user_account()
returns void as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;

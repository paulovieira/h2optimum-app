DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_users', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_users(
    id serial primary key,
    email text unique not null,
    first_name text,
    last_name text,
    pw_hash text not null,
    created_at timestamptz not null default now(),
    active bool default true
    --recover_code text,  TODO: create a separate table with recover_codes: user_id, recover_code, recover_code_created_at
    --recover_code_created_at timestamptz
);

/*** END CODE FOR CHANGES  ***/

END;
$$;



DO $$

DECLARE
patch_exists int := _v.register_patch('insert_initial_users', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_users(email, first_name, last_name, pw_hash) values 
    ('admin', 'admin', '', ''),
    ('demo1', 'demo1', '', ''),
    ('demo2', 'demo2', '', ''),
    ('dick', 'dick', '', '');



/*** END CODE FOR CHANGES  ***/

END;
$$;


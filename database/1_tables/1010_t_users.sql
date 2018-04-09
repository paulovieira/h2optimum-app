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
    active bool default true,
    recover text,
    recover_valid_until timestamptz
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
    ('jose@gmail.com', 'jose', 'silva', '_abc'),
    ('jose2@gmail.com', 'jose 2', 'silva 2', '_abc');



/*** END CODE FOR CHANGES  ***/

END;
$$;


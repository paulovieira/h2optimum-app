DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_installations', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_installations(
    id serial primary key,
    user_id int references t_users(id) on delete set null,
    soil_type_code text references t_soil_types(code) on delete set null,
    crop_type_code text references t_crop_types(code) on delete set null,
    name text not null,
    slug text not null,
    description text,
    location jsonb default '{}',
    created_at timestamptz not null default now(),
    active bool default true,

    unique(user_id, slug)
);

/*** END CODE FOR CHANGES  ***/

END;
$$;


DO $$

DECLARE
patch_exists int := _v.register_patch('insert_initial_installations', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_installations(user_id, soil_type_code, crop_type_code, name, slug, description) values 
    (1, 'soil_sandy_loam', 'crop_corn', 'Permalab Demo', 'permalab-demo', ''),
    (1, 'soil_type_X', 'crop_type_X', 'Milho 1 Demo', 'milho-1-demo', ''),
    (1, 'soil_type_Y', 'crop_type_Y', 'Milho 2 Demo', 'milho-2-demo', '');


/*** END CODE FOR CHANGES  ***/

END;
$$;


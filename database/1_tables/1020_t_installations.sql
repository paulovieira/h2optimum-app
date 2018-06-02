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
    (2, 'loamy_sand', 'crop_type_x', 'Permalab - demo', 'permalab-demo', ''),
    (3, 'loamy_sand', 'crop_type_x', 'Casa do Lecas - demo', 'casa-do-lecas-demo', '');


/*** END CODE FOR CHANGES  ***/

END;
$$;







DO $$

DECLARE
patch_exists int := _v.register_patch('add_timezone_column', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

alter table t_installations add column timezone text default '';

/*** END CODE FOR CHANGES  ***/

END;
$$;




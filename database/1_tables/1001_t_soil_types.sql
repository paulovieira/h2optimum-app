DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_soil_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_soil_types(
    id serial primary key,
    code text unique,
    description text,
    active bool default true
);

/*** END CODE FOR CHANGES  ***/

END;
$$;




DO $$

DECLARE
patch_exists int := _v.register_patch('insert_initial_soil_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_soil_types(code, description) values 
    ('soil_loam', 'loam'),
    ('soil_sandy_loam', 'sandy loam'),
    ('soil_light_texture_silt_loam', 'light texture silt loam'),
    ('soil_heavier_texture_silt_loam', 'heavier texture silt loam'),
    ('soil_fine_sand', 'fine sand'),
    ('soil_type_x', 'soil type X description'),
    ('soil_type_y', 'soil type Y description'),
    ('soil_type_z', 'soil type Z description');

/*** END CODE FOR CHANGES  ***/

END;
$$;



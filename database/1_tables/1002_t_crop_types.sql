DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_crop_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_crop_types(
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
patch_exists int := _v.register_patch('insert_initial_crop_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_crop_types(code, description) values 
    ('crop_corn', 'corn description'),
    ('crop_fruits', 'fruits description'),
    ('crop_wheat', 'wheat description'),
    ('crop_grapes', 'grapes description'),
    ('crop_type_x', 'crop type X description'),
    ('crop_type_y', 'crop type Y description'),
    ('crop_type_z', 'crop type Z description');

/*** END CODE FOR CHANGES  ***/

END;
$$;



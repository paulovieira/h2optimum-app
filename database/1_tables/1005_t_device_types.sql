DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_device_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_device_types(
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
patch_exists int := _v.register_patch('insert_initial_device_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_device_types(code, description) values 
    ('device_sensor', 'device with sensors'),
    ('device_switch', 'device connected to an irrigation system'),
    ('device_mixed', 'device with both capabilities');


/*** END CODE FOR CHANGES  ***/

END;
$$;



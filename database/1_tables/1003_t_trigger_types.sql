DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_trigger_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_trigger_types(
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
patch_exists int := _v.register_patch('insert_initial_trigger_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_trigger_types(code, description) values 
    ('trigger_water_potential', 'trigger based on water potential readings'),
    ('trigger_irrigation_device', 'trigger based on the state of the device controlling the irrigation'),
    ('trigger_forecast', 'trigger based on the state of weather forecast');


/*** END CODE FOR CHANGES  ***/

END;
$$;



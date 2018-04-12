DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_battery_modes', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_battery_modes(
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
patch_exists int := _v.register_patch('insert_initial_battery_modes', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_battery_modes(code, description) values 
    ('battery_normal', 'normal mode - the frequency of measurements and requests is adjusted requency according to charge level'),
    ('battery_eco', 'eco mode - similar to normal mode, but will work only when the charge is increasing'),
    ('battery_standby', 'standby mode - do not at all until the battery is full');


/*** END CODE FOR CHANGES  ***/

END;
$$;



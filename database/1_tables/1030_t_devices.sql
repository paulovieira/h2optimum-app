DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_devices', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_devices(
    id serial primary key,
    user_id int references t_users(id) on delete set null,
    installation_id int references t_installations(id) on delete set null,
    device_type_code text references t_device_types(code) on delete set null,
    battery_mode_code text references t_battery_modes(code) on delete set null default 'battery_normal',
    mac macaddr not null,
    activation_key text,
    description text,
    last_reading timestamptz not null default now(),
    created_at timestamptz not null default now(),
    active bool default true,

    unique(mac, activation_key),
    unique(installation_id, mac)
);

/*** END CODE FOR CHANGES  ***/

END;
$$;


DO $$

DECLARE
patch_exists int := _v.register_patch('insert_initial_devices', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_devices(user_id, installation_id, device_type_code, mac, activation_key, description) values 
    (1, 1, 'device_sensor', 'aa:bb:cc:dd:ee:ff', '', 'device description Demo');



/*** END CODE FOR CHANGES  ***/

END;
$$;


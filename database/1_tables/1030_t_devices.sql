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
    user_id int references t_users(id) on delete set null, -- this field is a bit redundant, see the note below
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

-- NOTE: we could obtain user_id from installation_id, but having both in this table makes the code easier; and since this table can be used only
-- with authenticated requests, we always have user_id

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
    (2, 1, 'device_sensor', 'f8:f0:05:f7:df:1f', '', 'device description Demo'),
    (3, 2, 'device_sensor', 'f8:f0:05:f5:e0:6e', '', 'device description Demo');
    



/*** END CODE FOR CHANGES  ***/

END;
$$;


DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_triggers', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

-- note: these triggers are NOT related to database triggers
create table t_triggers(
    id serial primary key,
    user_id int references t_users(id) on delete set null,
    installation_id int references t_installations(id) on delete set null,
    device_id int references t_devices(id) on delete set null,

    trigger_type_code text references t_trigger_types(code) on delete set null,
    trigger_config jsonb default '{}',

    action_type_code text references t_action_types(code) on delete set null,
    action_config jsonb default '{}',
    
    created_at timestamptz not null default now(),  -- TODO: we should be recording all changes to a given trigger, to show the history
    active bool default true
);

/*** END CODE FOR CHANGES  ***/

END;
$$;


DO $$

DECLARE
patch_exists int := _v.register_patch('insert_initial_triggers', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_triggers(user_id, installation_id, device_id, trigger_type_code, trigger_config, action_type_code, action_config) values 
    (1, 1, 1, 'trigger_water_potential', '{ "abc": "Demo" }', 'action_email', '{ "def": "Demo" }');



/*** END CODE FOR CHANGES  ***/

END;
$$;


DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_action_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_action_types(
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
patch_exists int := _v.register_patch('insert_initial_action_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

insert into t_action_types(code, description) values 
    ('action_email', 'send email'),
    ('action_sms', 'send sms'),
    ('action_irrigation', 'change the state of irrigation');


/*** END CODE FOR CHANGES  ***/

END;
$$;



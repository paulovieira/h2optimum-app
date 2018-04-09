DO $$

DECLARE
patch_exists int := _v.register_patch('create_uuid_ossp', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/*** END CODE FOR CHANGES  ***/

END;
$$;


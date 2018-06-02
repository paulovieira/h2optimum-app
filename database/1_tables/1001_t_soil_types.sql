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






DO $$

DECLARE
patch_exists int := _v.register_patch('update_soil_types', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

-- the previous soil types should ALL become non-active
update t_soil_types set active = 'f';

insert into t_soil_types(code, description) values 
    ('loamy_sand', 'loamy sand'),
    ('fine_sandy_loam', 'fine sandy loam'),
    ('sandy_loam', 'sandy loam'),
    ('loam', 'loam'),
    ('clay', 'clay');
  

/*** END CODE FOR CHANGES  ***/

END;
$$;






DO $$

DECLARE
patch_exists int := _v.register_patch('add_reference_thresholds_for_wp', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

alter table t_soil_types add column limit1 real default 10;
alter table t_soil_types add column limit2 real default 50;

update t_soil_types set
    limit1 = 10, limit2 = 25
    where code = 'loamy_sand';

update t_soil_types set
    limit1 = 10, limit2 = 30
    where code = 'fine_sandy_loam';

update t_soil_types set
    limit1 = 13, limit2 = 40
    where code = 'sandy_loam';

update t_soil_types set
    limit1 = 23, limit2 = 82
    where code = 'loam';

update t_soil_types set
    limit1 = 35, limit2 = 200
    where code = 'clay';

/*** END CODE FOR CHANGES  ***/

END;
$$;
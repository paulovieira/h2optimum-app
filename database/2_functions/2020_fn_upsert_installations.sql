CREATE OR REPLACE FUNCTION upsert_installations(data jsonb)
RETURNS SETOF t_installations 
AS $fn$

DECLARE
new_row     t_installations%rowtype;
current_row t_installations%rowtype;
n int;

BEGIN

new_row := jsonb_populate_record(null::t_installations, data);

-- if the id was not given in the input, this is a new row
if new_row.id is null then
    new_row.id := nextval(pg_get_serial_sequence('t_installations', 'id'));

    -- check if the given slug is already being user by this user (for some other installation);
    -- if so, change the slug by adding a random suffix

    -- note: FOR UPDATE prevents the row from being locked, modified or deleted by other 
    -- transactions until the current transaction ends. See:
    -- http://www.postgresql.org/docs/9.4/static/explicit-locking.html

    SELECT * FROM t_installations where slug = new_row.slug and user_id = new_row.user_id FOR UPDATE INTO current_row;
    GET DIAGNOSTICS n := ROW_COUNT;

    IF n != 0 THEN
        new_row.slug := new_row.slug || '-' || get_random_string();
    END IF;
else
    -- else, this is an existing row; make sure the row actually exists;
    -- see http://www.postgresql.org/docs/9.5/static/plpgsql-statements.html
    SELECT * FROM t_installations where id = new_row.id FOR UPDATE INTO current_row;
    GET DIAGNOSTICS n := ROW_COUNT;

    -- if the row does not exist, throw an exception (the row might have
    -- been deleted before this function is executed)
    IF n = 0 THEN
        PERFORM raise_exception_no_data_found('t_installations', new_row.id::text);
    END IF;
end if;

-- consider default values; we now have to do this for all columns
-- to handle the case where data is to be updated
new_row.user_id        := COALESCE(new_row.user_id,     current_row.user_id);
new_row.soil_type_code := COALESCE(new_row.soil_type_code, current_row.soil_type_code);
new_row.crop_type_code := COALESCE(new_row.crop_type_code, current_row.crop_type_code);
new_row.name           := COALESCE(new_row.name, current_row.name);
new_row.slug           := COALESCE(new_row.slug, current_row.slug);
new_row.description    := COALESCE(new_row.description, current_row.description);
new_row.location       := COALESCE(new_row.location, current_row.location);
new_row.active         := COALESCE(new_row.active, current_row.active, true);


-- the rest of the code is similar to 2.1; we just add the on conflict clause;
insert into t_installations(
  id,
  user_id,         
  soil_type_code, 
  crop_type_code,
  name,             
  slug,
  description,     
  location,
  active
)
values (
  new_row.id,
  new_row.user_id,         
  new_row.soil_type_code, 
  new_row.crop_type_code,
  new_row.name,
  new_row.slug,             
  new_row.description,             
  new_row.location,     
  new_row.active          
)

/*  
this part is executed only if the id was given and corresponds to an 
existing record; if some fields were not given in the input object, the
current data for those fields will be used (see the usage of coalesce) 
*/

on conflict (id) do update set
  user_id        = excluded.user_id,         
  soil_type_code = excluded.soil_type_code, 
  crop_type_code = excluded.crop_type_code,
  name           = excluded.name,             
  slug           = excluded.slug,             
  description    = excluded.description,             
  location       = excluded.location,     
  active         = excluded.active  

returning * 
into strict new_row;

return next new_row;
return;

END;
$fn$
LANGUAGE plpgsql;


/*

-- new record

select * from upsert_installations('{ 
    "user_id": 1,
    "soil_type_code": "soil_sandy_loam",
    "crop_type_code": "crop_corn",
    "name"          : "installation name",
    "slug"          : "installation-name",
    "description"   : "installation desc"
}');

-- update one field in the previous record

select * from upsert_installations('{ 
    "id": N,
    "active": false
}');

*/

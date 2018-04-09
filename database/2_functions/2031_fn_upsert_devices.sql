CREATE OR REPLACE FUNCTION upsert_devices(data jsonb)
RETURNS SETOF t_devices 
AS $fn$

DECLARE
new_row     t_devices%rowtype;
current_row t_devices%rowtype;
n int;

BEGIN

new_row := jsonb_populate_record(null::t_devices, data);

-- if the id was not given in the input, this is a new row
if new_row.id is null then
    new_row.id := nextval(pg_get_serial_sequence('t_devices', 'id'));
else
    -- else, this is an existing row; make sure the row actually exists;
    -- see http://www.postgresql.org/docs/9.5/static/plpgsql-statements.html
    SELECT * FROM t_devices where id = new_row.id FOR UPDATE INTO current_row;
    GET DIAGNOSTICS n := ROW_COUNT;

    -- if the row does not exist, throw an exception (the row might have
    -- been deleted before this function is executed)
    IF n = 0 THEN
        PERFORM raise_exception_no_data_found('t_devices', new_row.id::text);
    END IF;
end if;

-- consider default values; we now have to do this for all columns
-- to handle the case where data is to be updated
new_row.user_id          := COALESCE(new_row.user_id,     current_row.user_id);
new_row.installation_id  := COALESCE(new_row.installation_id, current_row.installation_id);
new_row.device_type_code := COALESCE(new_row.device_type_code, current_row.device_type_code);
new_row.mac              := COALESCE(new_row.mac, current_row.mac);
new_row.activation_key   := COALESCE(new_row.activation_key, current_row.activation_key);
new_row.description      := COALESCE(new_row.description, current_row.description);
new_row.last_reading     := COALESCE(new_row.last_reading, current_row.last_reading, now());
new_row.active           := COALESCE(new_row.active, current_row.active, true);


--raise notice '%', new_row.activation_key;
if new_row.activation_key = '' then
  new_row.activation_key := uuid_generate_v4();
end if;

-- the rest of the code is similar to 2.1; we just add the on conflict clause;
insert into t_devices(
  id,
  user_id,         
  installation_id, 
  device_type_code,
  mac,             
  activation_key,             
  description,     
  last_reading,    
  active          
)
values (
  new_row.id,
  new_row.user_id,         
  new_row.installation_id, 
  new_row.device_type_code,
  new_row.mac,             
  new_row.activation_key,             
  new_row.description,     
  new_row.last_reading,    
  new_row.active          
)

/*  
this part is executed only if the id was given and corresponds to an 
existing record; if some fields were not given in the input object, the
current data for those fields will be used (see the usage of coalesce) 
*/

on conflict (id) do update set
  user_id          = excluded.user_id,         
  installation_id  = excluded.installation_id, 
  device_type_code = excluded.device_type_code,
  mac              = excluded.mac,             
  activation_key   = excluded.activation_key,             
  description      = excluded.description,     
  last_reading     = excluded.last_reading,    
  active           = excluded.active  

returning * 
into strict new_row;

return next new_row;
return;

END;
$fn$
LANGUAGE plpgsql;


/*

-- new record

select * from upsert_devices('{ 
    "user_id": 1,
    "installation_id": 1,
    "device_type_code": "device_sensor",
    "mac": "aa:bb:cc:dd:ee:ff",
    "activation_key": ""
}');

-- update one field in the previous record

select * from upsert_devices('{ 
    "id": N,
    "mac": "aa:bb:cc:dd:ee:aa"
}');

*/

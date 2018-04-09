CREATE OR REPLACE FUNCTION read_devices(options jsonb)
RETURNS SETOF t_devices 
AS $fn$

DECLARE

query text;

-- variables for input query options
_user_id int;
_installation_id int;


BEGIN

_user_id := COALESCE((options->>'userId')::int);
_installation_id := COALESCE((options->>'installationId')::int);


if _user_id is null then
  PERFORM raise_exception_invalid_or_missing_args('read_measurements', 'userId');
end if;

-- TODO: is installationId is missing, it should return all the devices (among all installations for a given user)

if _installation_id is null then
  PERFORM raise_exception_invalid_or_missing_args('read_measurements', 'installationId');
end if;

query := $$

select * from t_devices
where 
  user_id = %s and
  installation_id = %s
order by id asc

$$;

query := format(query, _user_id, _installation_id);
raise notice '%', query;

RETURN QUERY EXECUTE query;

RETURN;



END;
$fn$
LANGUAGE plpgsql;


/*

select * from read_devices('{ 
    "userId": 1,
    "installationId": 1

}');

*/

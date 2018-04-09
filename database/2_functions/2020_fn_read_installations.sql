CREATE OR REPLACE FUNCTION read_installations(options jsonb)
RETURNS SETOF t_installations 
AS $fn$

DECLARE

query text;

-- variables for input query options
_user_id int;


BEGIN

_user_id := COALESCE((options->>'userId')::int);

if _user_id is null then
  PERFORM raise_exception_invalid_or_missing_args('read_measurements', 'userId');
end if;


query := $$

select * from t_installations
where 
  user_id = %s
order by id asc

$$;

query := format(query, _user_id);
--raise notice '%', query;

RETURN QUERY EXECUTE query;

RETURN;



END;
$fn$
LANGUAGE plpgsql;


/*

select * from read_installations('{ 
    "user_id": 1

}');

*/

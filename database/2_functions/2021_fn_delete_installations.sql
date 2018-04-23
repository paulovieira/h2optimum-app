CREATE OR REPLACE FUNCTION delete_installations(options jsonb)
RETURNS SETOF t_installations 
AS $fn$

DECLARE

row_to_delete t_installations%rowtype;

-- variables for input query options
_id int;
_user_id int;

BEGIN

_id      := COALESCE((options->>'id')::int);
_user_id := COALESCE((options->>'userId')::int);

if _id is null then
  PERFORM raise_exception_invalid_or_missing_args('read_measurements', 'id');
end if;

if _user_id is null then
  PERFORM raise_exception_invalid_or_missing_args('read_measurements', 'userId');
end if;



row_to_delete := jsonb_populate_record(null::t_installations, '{}'::jsonb);

delete from t_installations
where 
	id = _id and
	user_id = _user_id
returning * 
into strict row_to_delete;

-- STRICT INTO: "the query must return exactly one row or a run-time error P0002 will
-- be reported" (http://www.postgresql.org/docs/9.5/static/plpgsql-statements.html)

return next row_to_delete;
return;

END;
$fn$
LANGUAGE plpgsql;


/*


select * from delete_installations('{ 
    "id": 5,
    "userId": 1
}');


-- if there is no record with the given id, error P0002 is thrown

select * from delete_installations('{ 
    "id": 9999999,
    "userId": 1
}');


-- if there is some missing argument, error P0000 is thrown

select * from delete_installations('{ 
    "id": 1,
    "xuserId": 1
}');


*/

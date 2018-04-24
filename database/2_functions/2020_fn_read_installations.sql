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
  PERFORM raise_exception_invalid_or_missing_args('read_installations', 'userId');
end if;


RETURN QUERY

select * from t_installations
where 
	user_id = _user_id
order by id asc;


RETURN;




END;
$fn$
LANGUAGE plpgsql;


/*

select * from read_installations('{ 
    "userId": 1

}');


-- if there is some missing argument, error P0000 is thrown

select * from read_installations('{ 
    "xuserId": 1
}');


*/

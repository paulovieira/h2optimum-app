CREATE OR REPLACE FUNCTION delete_devices(data jsonb)
RETURNS SETOF t_devices 
AS $fn$

DECLARE
row_to_delete t_devices%rowtype;

BEGIN

row_to_delete := jsonb_populate_record(null::t_devices, data);

delete from t_devices
where 
	id = row_to_delete.id and
	user_id = row_to_delete.user_id
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


select * from delete_devices('{ 
    "id": 5
}');


-- if there is no record with the given id, an error is thrown

select * from delete_devices('{ 
    "id": 9999999
}');

*/
